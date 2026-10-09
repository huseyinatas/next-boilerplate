<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules

This repository is a reusable Next.js boilerplate. Keep it product-neutral: add no domain content or features unless the task asks for them. (Projects created from it replace this paragraph with one sentence about the product.)

These rules apply to every coding agent. `pnpm check` enforces most of them; when a check message names a replacement, use that replacement.

## Commands and done

- Use pnpm only. `pnpm dev` runs the app; `pnpm format` formats.
- Done means `pnpm check` exits 0 after your last edit (types, lint, formatting, tests, unused code, dictionaries, rule files). A check that failed to start does not count. CI also runs `pnpm build`.
- Keep working until everything the user asked for is done; stop early only for the cases under "Stop and ask". When the work is done and checked, stop and report.
- Keep the report short: the files you changed, each command you ran with its exit code and last output lines pasted verbatim, the assumptions you made, and improvements you noticed but did not make. If a check still fails, paste the failure instead of saying the change should work.

## Stop and ask before you

1. Add, remove or upgrade a dependency. Propose it with its purpose and the output of `pnpm view <name> version time.modified repository.url`; prefer releases at least 14 days old. Needing approval is a reason to ask, never a reason to hand-write the library instead.
2. Change project configuration: any config file at the repository root (`package.json`, `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `knip.jsonc` and the like), anything in `.claude/`, `.github/` or `scripts/`, or the locale settings in `src/i18n/config.ts` (the locale list, default locale, `I18N_ENABLED`). Fixing a bug or building the feature the task describes is not a configuration change, even when the code lives in one of these files.
3. Make a check pass by disabling a rule, adding a `@ts-` comment or a narrowing `as` cast, skipping or editing a test, or loosening a config.
4. Try a third fix for a check that has failed twice for the same reason.
5. Delete or rename existing files, or add a top-level folder.
6. Choose between two readings of the request that would change different files.

Otherwise proceed, and list your assumptions in the report.

## Where code goes

Open the reference file and follow its pattern.

| Task                                | Location                                                     | Reference                                                                                  | Also required                                                  |
| ----------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Page                                | `src/app/[lang]/<segment>/page.tsx`                          | `src/app/[lang]/page.tsx`                                                                  | Text in every dictionary; `generateMetadata` sets the title and `localizedAlternates(locale, path)` |
| Dynamic segment                     | `src/app/[lang]/<segment>/[param]/page.tsx`                  | `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md` | `generateStaticParams`, and `notFound()` for unknown values    |
| Interactive component               | `src/components/<name>.tsx` with `"use client"`              | `src/components/language-switcher.tsx`                                                     | Text arrives as props; classes via `cn()`                      |
| Redirect, rewrite, locale detection | `src/proxy.ts`, never `middleware.ts`                        | `src/proxy.test.ts`                                                                        | Add a test case; build URLs with `localizePath()`              |
| User-facing text                    | `src/i18n/dictionaries/tr.json`, then every other dictionary | `src/i18n/dictionaries.ts`                                                                 | Server: `getDictionary()`; client: props                       |
| Environment variable                | `src/env.ts`                                                 | `src/env.ts`                                                                               | Document it in `.env.example`                                  |
| Logic with branches                 | a `<module>.test.ts` next to the module                      | `src/i18n/config.test.ts`                                                                  | Cover the behavior, not the implementation                     |
| Feature code                        | `src/features/<name>/` (create on first use)                 | none yet                                                                                   | `src/components/` stays domain-free                            |

## Next.js and i18n

- Server Components by default. Add `"use client"` only for state, effects, event handlers, browser APIs or Motion, on the smallest component that needs it, never on a page or layout.
- `cacheComponents` is on: uncached request-time data (`cookies()`, `headers()`, `searchParams`, `useSearchParams()`, `fetch`) needs a `<Suspense>` boundary or `"use cache"`; give the fallback the size of what it replaces. A value fixed per release (a "last updated" date, a version) is a constant, not `new Date()` or `connection()`. Keep static routes static.
- The default locale has no URL prefix (`/about`); the others do (`/en/about`). Build internal links with `localizePath()`, never by hand.
- `tr.json` defines the `Dictionary` type, so a key missing from another dictionary is a type error.
- Use `next/link`, `next/image`, `next/font` and the Metadata API.

## Writing code

- Only make changes that are requested or clearly necessary. A bug fix does not need the surrounding code cleaned up; a feature does not need options nobody asked for. Mention other improvements in the report.
- Do not create helpers, hooks, wrappers or files for one-time operations or hypothetical needs; extract only when the change has a second real caller. Types and constants used by one module stay in it.
- Do not add checks, fallbacks or `try/catch` for states the types or the framework already rule out. Validate untrusted input once where it enters (params, search params, cookies, headers, form data, env, external JSON), then trust the types. Catch an error only to recover, translate it or add context.
- Before hand-writing any behavior, use what exists: `Intl.*`, Next.js and React APIs, `motion/react`, `lucide-react`, `cn()` from `@/lib/utils`. If nothing installed covers it but a mature library does (theme switching, persisted UI preferences, carousels, date pickers, form validation, toasts and the like), stop and ask (rule 1). Hand-written examples in the Next.js docs do not override this.
- Name values by their domain role (`rooms`, `checkIn`, `isAvailable`), not their shape (`data`, `item`, `result`).
- Write a comment only when the reason is invisible in the code: a hidden constraint, an invariant, a workaround for an upstream bug (with its link), or behavior that would surprise a reader. Never refer to the task, the conversation or the change history. Keep existing comments in code you do not change.
- Leave no scratch files, notes or new Markdown files behind.

## UI and copy

- Colors and fonts come from the theme tokens in `src/app/[lang]/globals.css` (`surface`, `ink`, `accent` and their variants); the default Tailwind palette is switched off. If a token is missing, ask instead of inventing a value.
- Tailwind transitions for hover and focus; `motion/react` for enter and exit, layout, gesture and scroll-linked motion. Respect reduced motion.
- Unless the design asks for them, avoid uppercase tracked labels above headings, `→` appended to links or buttons, `A · B · C` meta lines, grids of identical rounded cards sharing one shadow, gradient washes, a fade-and-slide-up entrance on every section, and hover effects on every card.
- Copy is plain, in sentence case, and says what happens ("Check availability", not "Submit"). Errors say what went wrong and what to do next. No emoji, exclamation marks or sales words.
- Semantic HTML first; icon-only buttons need an accessible name; keep focus visible.

## Secrets

- Never open, print or commit `.env*` files other than `.env.example`. Modules that read secrets start with `import "server-only"`.
