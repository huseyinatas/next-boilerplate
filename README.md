# Next.js boilerplate

A production-ready starting point for multilingual Next.js apps, built so that people and AI coding agents produce the same reviewable, idiomatic code. Most rules are enforced by tools rather than written down, and every check runs through one command: `pnpm check`.

**Stack:** Next.js 16 (App Router, Cache Components, React Compiler), React 19, TypeScript, Tailwind CSS 4, Motion, Lucide, Vitest, ESLint 10, Prettier, knip, lefthook, pnpm 11.

## Getting started

Requirements: Node.js 22.13 or later (`.nvmrc` pins the recommended 24 LTS) and pnpm. The `packageManager` field selects the exact pnpm version.

```bash
pnpm install          # also installs the git hooks once the folder is a git repository
cp .env.example .env.local
pnpm dev              # http://localhost:3000
```

## Commands

| Command            | What it does                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `pnpm dev`         | Development server                                                                                    |
| `pnpm build`       | Production build                                                                                      |
| `pnpm check`       | The quality gate: types, lint, formatting, tests, unused code, dictionaries, rule files               |
| `pnpm typecheck`   | `next typegen` and `tsc`                                                                              |
| `pnpm lint`        | ESLint with zero warnings allowed                                                                     |
| `pnpm test`        | Vitest unit tests                                                                                     |
| `pnpm format`      | Prettier, including import and Tailwind class order                                                   |
| `pnpm knip`        | Unused files, exports and dependencies                                                                |
| `pnpm check:i18n`  | Every dictionary has the same keys as `tr.json`; copy has no emoji, arrows, exclamation marks or caps |
| `pnpm check:rules` | `AGENTS.md` stays within budget and points only at things that exist                                  |

Work is done when `pnpm check` exits 0. CI additionally runs `pnpm build` and `pnpm audit`.

## Project layout

```text
src/
  app/[lang]/        routes, layouts, metadata (the default locale has no URL prefix)
  components/        shared, domain-free UI
  features/<name>/   domain code, created when the first feature lands
  i18n/              locale config, dictionaries and their loader
  lib/utils.ts       cn() for class composition
  env.ts             the only module that reads process.env
  proxy.ts           locale detection, redirects and rewrites
scripts/             repository checks and the agent hooks
```

## Internationalization

- `src/i18n/config.ts` lists the locales and the `I18N_ENABLED` switch. With it off, the site serves only the default locale: no prefixes, no language switcher, no locale detection.
- The default locale is served without a prefix (`/about`); the others are prefixed (`/en/about`). Build internal links with `localizePath()`.
- `tr.json` is the source dictionary and defines the `Dictionary` type, so a key missing from another locale fails the type check.
- Visitors are routed by their saved choice first, then by `Accept-Language`.
- To add a locale: add its code to `supportedLocales` and `localeNames`, add `src/i18n/dictionaries/<code>.json`, register it in `src/i18n/dictionaries.ts`, then run `pnpm check`.

## Quality gates

| Layer                           | Enforces                                                                                                                                                                                                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript                      | `strict` plus `noUncheckedIndexedAccess`, `verbatimModuleSyntax` and other safety flags                                                                                                                                                                        |
| ESLint (`eslint.config.mjs`)    | Type-aware strict rules; accessibility; kebab-case file names; no hardcoded UI text; no hand-written animation, observers or scroll listeners; `cn()` for classes; no manual memoization; no vague names, narrating comments or TODOs; architecture boundaries |
| Theme                           | The default Tailwind palette is switched off, so colors come only from the tokens in `globals.css`                                                                                                                                                             |
| Prettier                        | Formatting, import order and Tailwind class order                                                                                                                                                                                                              |
| knip                            | Unused files, exports and dependencies                                                                                                                                                                                                                         |
| Git hooks (`lefthook.yml`)      | Format and lint staged files on commit; `pnpm check` on push                                                                                                                                                                                                   |
| CI (`.github/workflows/ci.yml`) | `pnpm check`, `pnpm build` and `pnpm audit`, with actions pinned by commit SHA                                                                                                                                                                                 |

Inline `eslint-disable` comments and `@ts-` suppressions are turned off. Exceptions go into the config files, which are reviewed like code.

Dependencies use exact versions. New ones are added only after review, preferably from releases at least 14 days old. Known advisories without a fix are listed with a reason in `pnpm-workspace.yaml`.

## Working with AI coding agents

`AGENTS.md` is the single source of agent rules. Claude Code reads it through `CLAUDE.md`. Codex, Cursor and GitHub Copilot read it directly. Gemini CLI reads it through `.gemini/settings.json`. Nested rule files and tool-specific rule files are rejected by `pnpm check:rules`, so the rules cannot fork.

Start every agent at the repository root. Claude Code then also applies `.claude/settings.json` once you accept the workspace trust prompt:

- After each edit, the changed file is formatted and linted, and any problem goes straight back to the agent.
- Before the agent can finish, `pnpm check` must pass. It runs only when files changed and gives up after three blocks, leaving CI as the final gate.
- Bash commands that use npm, npx or yarn, or that skip git hooks, are blocked.
- Edits to configuration, rules, tests and scripts ask for your approval. `.env` files cannot be read.

Choosing a model:

| Task                                                          | Plan with                           | Implement with                             |
| ------------------------------------------------------------- | ----------------------------------- | ------------------------------------------ |
| A row of the "Where code goes" table in `AGENTS.md`, or a fix | Not needed                          | Any model; for Haiku, set `/effort high`   |
| A multi-file feature within existing patterns                 | Opus or Sonnet in plan mode         | Sonnet, or Haiku one plan step per session |
| A new dependency, data flow, config change or pattern         | You, together with a frontier model | A frontier model                           |

Use `REVIEW.md` as the checklist for reviewing agent work, whether by hand or with an AI reviewer.

### Changing the rules

When an agent repeats a mistake, prefer, in this order:

1. a lint rule whose message names the fix;
2. a better reference file;
3. a test;
4. only then, a line in `AGENTS.md`.

`pnpm check:rules` keeps `AGENTS.md` under 150 lines. Start a new agent session before judging a rule change, because sessions keep the instructions they started with.

## Starting a new project from this template

1. Replace the identity paragraph at the top of the project rules in `AGENTS.md` with one sentence about the product.
2. Update `metadata` in the dictionaries, and the placeholder palette in `src/app/[lang]/globals.css`.
3. Set `NEXT_PUBLIC_SITE_URL` for production deploys; canonical and hreflang URLs depend on it.
4. When the repository is published, add a `.github/CODEOWNERS` entry for `AGENTS.md`, `.claude/`, `scripts/` and the config files, and protect `main` so that the CI check is required.
5. Commits made through Claude Code carry no AI attribution (`attribution` in `.claude/settings.json`). Remove that setting if your organization requires disclosure.
