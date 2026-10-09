import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { stripVTControlCharacters } from "node:util"
import { block, projectRoot, readHookInput } from "./hook-io.mjs"

// Usage: `stop-gate.mjs baseline` on SessionStart, `stop-gate.mjs` on Stop.
// The gate runs `pnpm check` only when the session changed files, blocks each failing
// state once, and gives up after a few blocks so CI stays the final gate.

const STATE_FILE = join(projectRoot, "node_modules/.cache/agent-gate/state.json")
const SKIPPED_DIRS = new Set(["node_modules", ".next", ".git", "coverage", "out", "build"])
// Written by the checks themselves; including them would make every run look like a change.
const GENERATED_FILES = /(?:\.tsbuildinfo|next-env\.d\.ts|\.DS_Store)$/
const MAX_BLOCKS_PER_SESSION = 3
const MAX_OUTPUT_LINES = 40
const NOISE = /^(?:\$ |> |Generating route types|✓ Types generated|\[ELIFECYCLE\]|ELIFECYCLE|$)/

function collectFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : collectFiles(path)
      return GENERATED_FILES.test(entry.name) ? [] : [path]
    })
    .sort()
}

function fingerprintTree() {
  const hash = createHash("sha256")
  for (const path of collectFiles(projectRoot)) {
    const stats = statSync(path)
    hash.update(`${relative(projectRoot, path)}:${stats.size}:${stats.mtimeMs}\n`)
  }
  return hash.digest("hex")
}

function loadState() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"))
  } catch {
    // A missing or corrupt state file only costs one extra check run.
    return { baselines: {}, passed: [], blocked: [], blocksBySession: {} }
  }
}

function saveState(state) {
  state.passed = state.passed.slice(-50)
  state.blocked = state.blocked.slice(-50)
  mkdirSync(dirname(STATE_FILE), { recursive: true })
  writeFileSync(STATE_FILE, JSON.stringify(state))
}

function runCheck() {
  // Cache Components errors (request data outside Suspense, new Date() in a static route)
  // only surface in a production build.
  const run = spawnSync("pnpm check && pnpm build", {
    cwd: projectRoot,
    encoding: "utf8",
    shell: true,
    timeout: 280_000,
    env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
  })
  if (run.error) return { ok: false, output: `The checks could not start: ${run.error.message}` }
  const lines = stripVTControlCharacters(`${run.stdout}\n${run.stderr}`)
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => !NOISE.test(line.trim()))
  return { ok: run.status === 0, output: lines.slice(0, MAX_OUTPUT_LINES).join("\n") }
}

const input = await readHookInput()
const session = String(input.session_id ?? input.sessionId ?? input.conversation_id ?? "unknown")
const state = loadState()
const current = fingerprintTree()

if (process.argv[2] === "baseline") {
  state.baselines[session] = current
  const sessions = Object.keys(state.baselines)
  for (const old of sessions.slice(0, -20)) delete state.baselines[old]
  saveState(state)
  process.exit(0)
}

const unchanged = state.baselines[session] === current || state.passed.includes(current)
const alreadyBlocked = state.blocked.includes(current)
const blocks = state.blocksBySession[session] ?? 0
if (
  unchanged ||
  alreadyBlocked ||
  blocks >= MAX_BLOCKS_PER_SESSION ||
  !existsSync(join(projectRoot, "node_modules"))
) {
  process.exit(0)
}

const check = runCheck()
const after = fingerprintTree()
if (check.ok) {
  state.passed.push(current, after)
} else {
  state.blocked.push(current)
  state.blocksBySession[session] = blocks + 1
  block(
    [
      "`pnpm check` or `pnpm build` failed. Fix the problems below, then stop.",
      'Fixing what the task asked for is never a "Stop and ask" case; stop and ask only if the remaining fix is a change that list covers.',
      "",
      check.output,
    ].join("\n"),
  )
}
saveState(state)
