import { fileURLToPath } from "node:url"

// Resolved from this file rather than the working directory, because every agent tool
// launches hooks from a different place.
export const projectRoot = fileURLToPath(new URL("../..", import.meta.url))

export async function readHookInput() {
  let raw = ""
  for await (const chunk of process.stdin) raw += chunk
  try {
    return JSON.parse(raw)
  } catch {
    // Tools that send no payload get no feedback rather than a crash in the agent loop.
    return {}
  }
}

// One contract that Claude Code, Cursor, Copilot CLI and Codex all accept.
export function block(reason) {
  process.stdout.write(JSON.stringify({ decision: "block", reason }))
}
