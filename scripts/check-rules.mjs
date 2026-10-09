import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { pathToFileURL } from "node:url"

// Agents follow fewer instructions as the always-loaded file grows, so it has a hard budget.
const BUDGET = { lines: 150, characters: 12_000, listItems: 45 }
const RULES_BLOCK = ["<!-- BEGIN:nextjs-agent-rules -->", "<!-- END:nextjs-agent-rules -->"]
const FEEDBACK_BLOCK = "<!-- BEGIN:nextjs-agent-feedback -->"
const ROOT_MARKDOWN = new Set(["README.md", "AGENTS.md", "CLAUDE.md", "REVIEW.md"])
const SKIPPED_DIRS = new Set(["node_modules", ".next", ".git", "coverage", "out", "build"])
// Paths the rules mention before they exist in a fresh copy of the template.
const FUTURE_PATHS = new Set(["src/features/"])
const PNPM_BUILTINS = new Set([
  "install",
  "add",
  "remove",
  "update",
  "exec",
  "dlx",
  "view",
  "audit",
])
const REPO_PATH = /^(?:src|scripts|node_modules\/next\/dist\/docs|\.claude|\.github)\//
const RULE_FILE = /^(?:AGENTS\.md|CLAUDE\.md|REVIEW\.md|\.claude\/|\.gemini\/|scripts\/agent\/)/
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]|\uDB40[\uDC00-\uDC7F]/u

const FORBIDDEN = [
  [
    /^(?:\.cursorrules|\.windsurfrules|\.clinerules|AGENT\.md|GEMINI\.md)$/,
    "rules belong in AGENTS.md",
  ],
  [/^\.github\/copilot-instructions\.md$/, "rules belong in AGENTS.md"],
  [/(?:^|\/)AGENTS\.override\.md$/, "overrides fork the rules per machine"],
  [
    /^.+\/(?:AGENTS|CLAUDE)\.md$/,
    "nested rule files load differently per tool; extend the root AGENTS.md",
  ],
  [/^eslint-suppressions\.json$/, "suppressions silence the lint gate"],
  [/(?:^|\/)middleware\.[jt]s$/, "Next.js 16 uses src/proxy.ts"],
  [/^tailwind\.config\.[cm]?[jt]s$/, "Tailwind 4 is configured in globals.css"],
  [/^(?:package-lock\.json|yarn\.lock|bun\.lockb?)$/, "pnpm-lock.yaml is the only lockfile"],
]

function listFiles(root, dir = root) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return SKIPPED_DIRS.has(entry.name) ? [] : listFiles(root, join(dir, entry.name))
    }
    return [relative(root, join(dir, entry.name)).split("\\").join("/")]
  })
}

function withoutRulesBlock(text) {
  const start = text.indexOf(RULES_BLOCK[0])
  const end = text.indexOf(RULES_BLOCK[1])
  if (start === -1 || end === -1) return text
  return text.slice(0, start) + text.slice(end + RULES_BLOCK[1].length)
}

function checkBudget(text, projectRules) {
  const lines = text.split("\n").length
  const listItems = projectRules.split("\n").filter((line) => /^\s*(?:[-*]|\d+\.)\s/.test(line))
  return [
    lines > BUDGET.lines && `AGENTS.md: ${lines} lines (budget ${BUDGET.lines})`,
    text.length > BUDGET.characters &&
      `AGENTS.md: ${text.length} characters (budget ${BUDGET.characters})`,
    listItems.length > BUDGET.listItems &&
      `AGENTS.md: ${listItems.length} list items (budget ${BUDGET.listItems})`,
  ].filter(Boolean)
}

function checkManagedBlocks(text) {
  return [
    (text.split(RULES_BLOCK[0]).length !== 2 || !text.trimStart().startsWith(RULES_BLOCK[0])) &&
      "AGENTS.md: the Next.js-managed rules block must appear exactly once, at the top",
    text.includes(FEEDBACK_BLOCK) &&
      "AGENTS.md: remove the agent feedback block and keep experimental.agentFeedback off",
  ].filter(Boolean)
}

function checkImportTokens(projectRules) {
  return projectRules
    .replace(/`[^`]*`/g, "")
    .split("\n")
    .flatMap((line, index) =>
      /(?:^|\s)@[\w./-]+/.test(line)
        ? [`AGENTS.md:${index + 1}: wrap @-tokens in backticks; some tools read them as imports`]
        : [],
    )
}

function checkPaths(root, projectRules) {
  return [...projectRules.matchAll(/`([^`\s]+)`/g)]
    .map(([, token]) => token)
    .filter((token) => REPO_PATH.test(token) && !/[*<]/.test(token) && !FUTURE_PATHS.has(token))
    .filter((token) => !existsSync(join(root, token)))
    .map((token) => `AGENTS.md: \`${token}\` does not exist; update the rule`)
}

function checkCommands(projectRules, scripts) {
  return [...projectRules.matchAll(/`pnpm ([\w:-]+)/g)]
    .map(([, command]) => command)
    .filter((command) => !(command in scripts) && !PNPM_BUILTINS.has(command))
    .map((command) => `AGENTS.md: \`pnpm ${command}\` is not a package.json script`)
}

function checkAgentsFile(root, scripts) {
  if (!existsSync(join(root, "AGENTS.md"))) return ["AGENTS.md is missing"]
  const text = readFileSync(join(root, "AGENTS.md"), "utf8")
  const projectRules = withoutRulesBlock(text)
  return [
    ...checkBudget(text, projectRules),
    ...checkManagedBlocks(text),
    ...checkImportTokens(projectRules),
    ...checkPaths(root, projectRules),
    ...checkCommands(projectRules, scripts),
  ]
}

function checkClaudeFile(root) {
  const path = join(root, "CLAUDE.md")
  const text = existsSync(path) ? readFileSync(path, "utf8") : ""
  if (text.trim() === "@AGENTS.md") return []
  return [
    "CLAUDE.md: must contain exactly `@AGENTS.md`; Claude-only settings go in .claude/settings.json",
  ]
}

function checkFile(root, file) {
  const problems = []
  const forbidden = FORBIDDEN.find(([pattern]) => pattern.test(file))
  if (forbidden) problems.push(`${file}: not allowed (${forbidden[1]})`)
  if (file.endsWith(".md") && !file.includes("/") && !ROOT_MARKDOWN.has(file)) {
    problems.push(`${file}: no extra Markdown files at the root; use README.md or delete it`)
  }
  if (RULE_FILE.test(file) && INVISIBLE.test(readFileSync(join(root, file), "utf8"))) {
    problems.push(`${file}: contains invisible or bidirectional Unicode characters`)
  }
  return problems
}

function checkClaudeSettings(root) {
  const path = join(root, ".claude/settings.json")
  if (!existsSync(path)) return []
  try {
    const settings = JSON.parse(readFileSync(path, "utf8"))
    if (settings.attribution !== false) return []
    return [
      ".claude/settings.json: use the object form of attribution; older versions skip the file",
    ]
  } catch (error) {
    return [`.claude/settings.json: invalid JSON (${error.message})`]
  }
}

export function checkRules(root = process.cwd()) {
  const { scripts = {} } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
  return [
    ...checkAgentsFile(root, scripts),
    ...checkClaudeFile(root),
    ...listFiles(root).flatMap((file) => checkFile(root, file)),
    ...checkClaudeSettings(root),
  ]
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const problems = checkRules()
  for (const problem of problems.slice(0, 40)) console.log(problem)
  process.exitCode = problems.length > 0 ? 1 : 0
}
