# Review rules

Flag only problems that affect correctness, the stated requirements, security, or a rule in AGENTS.md. Report anything else as a nit, at most three per review. Do not request extra abstractions, options, comments or tests beyond what the change needs.

Check the diff for:

- Scope: files or behavior the task did not ask for; refactors or renames mixed into a fix or feature.
- Abstractions with one caller: a new helper, hook, wrapper, component or file; a wrapper that only renames a library API.
- Hand-written work an installed library or the platform already does (`motion/react`, `Intl.*`, `next/image`, `cn()`), or a homemade version of something a mature library solves.
- Defensive code for states the types rule out; errors swallowed or turned into fallback values.
- Comments that narrate the code or mention the task; deleted comments that explained a constraint.
- Names that describe shape (`data`, `item`, `result`) instead of domain role.
- Copy that sells instead of saying what happens; vague errors; text outside the dictionaries.
- Visual defaults the design did not ask for: eyebrow labels, `→` on links, identical card grids sharing one shadow, gradient washes, an entrance animation on every section, values outside the theme tokens.
- Request-time data outside `<Suspense>` or `"use cache"`; `"use client"` higher in the tree than needed.
- Weakened checks: edited or skipped tests, relaxed config, new suppressions.
- Dependencies without a stated reason and an approval.
