<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Contributing to Embedded Academy

Thank you for helping. This page is the short version; the [project docs](docs/index.md) have the details, and [AGENTS.md](AGENTS.md) collects every rule in one place.

## Start from an issue

Find an issue or open one with the issue forms. Every change closes one issue. If you spot a technical error outside your task, open an `inaccuracy` issue instead of fixing it in passing.

## Work in a short-lived branch

The project uses GitHub Flow. `main` is protected and always deployable. Create one branch per issue and merge it within 3 days.

Name the branch `<type>/<scope>-<what>`: lowercase, hyphens, at most 50 characters, with an optional issue number.

```text
feat/anim-memory-map
content/m04-ddr-training
fix/42-boards-stm32-sysram
```

## Write Conventional Commits

```text
content(m03): explain TZC-400 regions on STM32MP1
```

Use the types `feat`, `content`, `fix`, `docs`, `refactor`, `test`, `build`, `ci` and `chore`. `content` covers lesson text, labs and logs; a wrong technical fact is a `fix`. The full rules are in [Commit conventions](docs/reference/commit-conventions.md).

## Sign off every commit

Commit with `git commit -s`. The flag adds a `Signed-off-by` line with your name and email. By adding it, you certify the [Developer Certificate of Origin](https://developercertificate.org/): you wrote the change, or have the right to submit it under the project's licenses.

Only sign off your own work. Never add a sign-off for someone else.

## Open a pull request

- Title it as a Conventional Commit; squash merge turns it into the commit on `main`.
- Link the issue with `Closes #N`.
- Keep it under 400 changed lines, excluding captured logs and lockfiles.
- Fill in the checklist in the pull request template. Leave a box unticked and say why rather than ticking it.
- Run the checks listed in [Commands](docs/reference/commands.md) before you ask for review.

## Get the facts right

Cite a source for every fact a learner could act on, and set verification levels honestly. Read the [accuracy policy](docs/explanation/accuracy-policy.md) before you write a lesson.

## License your work

Every new file starts with SPDX tags. Code is `MIT`; lessons, docs, diagrams and logs are `CC-BY-SA-4.0`. See [Licensing](docs/reference/licensing.md).
