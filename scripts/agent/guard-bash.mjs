import { readHookInput } from "./hook-io.mjs"

const COMMAND_START = String.raw`(?:^|[\s;&|(])`

const blocked = [
  [
    new RegExp(`${COMMAND_START}(?:npm|npx|yarn|bun|bunx)(?=\\s|$)`),
    "This project uses pnpm only: pnpm add, pnpm remove, pnpm exec, pnpm dlx.",
  ],
  [
    /--no-verify\b|\bgit\s+commit\b[^|;&]*\s-n\b/,
    "Git hooks are part of the checks; do not skip them.",
  ],
  [
    /\b(?:LEFTHOOK|HUSKY)=0\b|\bLEFTHOOK_EXCLUDE=|core\.hooksPath/,
    "Git hooks are part of the checks; do not disable them.",
  ],
  [
    /\beslint\b[^|;&]*--(?:suppress-all|suppress-rule|no-inline-config)\b/,
    "Fix the lint problem instead of suppressing it.",
  ],
]

const input = await readHookInput()
const command = input.tool_input?.command
if (typeof command === "string") {
  const match = blocked.find(([pattern]) => pattern.test(command))
  if (match) {
    process.stderr.write(`${match[1]} If the task truly needs this, stop and ask the developer.\n`)
    process.exit(2)
  }
}
