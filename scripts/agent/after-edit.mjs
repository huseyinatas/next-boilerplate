import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { basename, isAbsolute, join, relative } from "node:path"
import { checkDictionaries } from "../check-i18n.mjs"
import { checkRules } from "../check-rules.mjs"
import { block, projectRoot, readHookInput } from "./hook-io.mjs"

const MAX_PROBLEMS = 20
const LINTED = /\.[cm]?[jt]sx?$/
const ROUTE_FILE = /^(?:page|layout|template|default|not-found|route)\.tsx?$/

const input = await readHookInput()
const filePath = input.tool_input?.file_path ?? input.tool_input?.path
if (typeof filePath !== "string") process.exit(0)

const absolute = isAbsolute(filePath) ? filePath : join(projectRoot, filePath)
const file = relative(projectRoot, absolute).split("\\").join("/")
const outsideProject = file.startsWith("..") || /^(?:node_modules|\.next|\.git)\//.test(file)
if (outsideProject || !existsSync(absolute)) process.exit(0)

const problems = []

async function format() {
  const prettier = await import("prettier")
  const fileInfo = await prettier.getFileInfo(absolute, {
    ignorePath: join(projectRoot, ".prettierignore"),
  })
  if (fileInfo.ignored || !fileInfo.inferredParser) return

  const source = await readFile(absolute, "utf8")
  const options = await prettier.resolveConfig(absolute)
  try {
    const formatted = await prettier.format(source, { ...options, filepath: absolute })
    if (formatted !== source) await writeFile(absolute, formatted)
  } catch (error) {
    problems.push(`${file}: does not parse: ${String(error.message).split("\n")[0]}`)
  }
}

// Typed lint needs the route types in .next/types, including ones for routes Next.js
// has not seen yet.
function ensureRouteTypes() {
  const isRouteFile = file.startsWith("src/app/") && ROUTE_FILE.test(basename(file))
  if (!isRouteFile && existsSync(join(projectRoot, ".next/types"))) return
  spawnSync("pnpm", ["exec", "next", "typegen"], {
    cwd: projectRoot,
    shell: process.platform === "win32",
    stdio: "ignore",
  })
}

async function lint() {
  ensureRouteTypes()
  const { ESLint } = await import("eslint")
  const eslint = new ESLint({ cwd: projectRoot })
  if (await eslint.isPathIgnored(absolute)) return

  const [report] = await eslint.lintFiles([absolute])
  for (const message of report?.messages ?? []) {
    const rule = message.ruleId ?? "parse-error"
    problems.push(`${file}:${message.line ?? 0}:${message.column ?? 0} ${rule} ${message.message}`)
  }
}

await format()
if (LINTED.test(file) && problems.length === 0) await lint()
if (/^src\/i18n\/dictionaries\/[^/]+\.json$/.test(file))
  problems.push(...checkDictionaries(projectRoot))
if (/^(?:AGENTS\.md|CLAUDE\.md|REVIEW\.md|\.claude\/)/.test(file))
  problems.push(...checkRules(projectRoot))

if (problems.length > 0) {
  const shown = problems.slice(0, MAX_PROBLEMS)
  if (problems.length > MAX_PROBLEMS) shown.push(`…and ${problems.length - MAX_PROBLEMS} more`)
  block(`${shown.join("\n")}\nFix these before continuing.`)
}
