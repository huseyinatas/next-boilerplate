import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"

// pnpm runs this on every install; a missing repository or a broken git
// must never fail the install itself.
if (process.env.CI) process.exit(0)

if (!existsSync(".git")) {
  console.log("Git hooks skipped: not a git repository. Run `pnpm install` again after `git init`.")
  process.exit(0)
}

const install = spawnSync("lefthook", ["install"], { shell: true, encoding: "utf8" })

if (install.status !== 0) {
  const reason = (install.stderr || install.stdout || "").trim().split("\n")[0]
  console.warn(`Git hooks not installed: ${reason}`)
}
