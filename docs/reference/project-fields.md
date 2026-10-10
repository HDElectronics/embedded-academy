<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Project fields

The **Embedded Academy** GitHub Project tracks every issue and pull request. `scripts/github/setup-project.sh` creates its fields, milestones and labels; the script is the source of truth for their exact option lists.

## Fields

Status
: `Todo`, `In progress`, `In review` or `Done`. You move an issue to **In progress** when you start it. The project workflows move it to **In review** when a linked pull request opens and to **Done** when it merges.

Priority
: `P0`, `P1` or `P2`. `P0` is the most urgent.

Size
: `S`, `M` or `L`. Split an `L` into smaller issues before you start it.

Verification
: `unverified`, `emulated` or `hardware`. Set it on content issues. It uses the same levels as the lesson frontmatter; see [Lesson frontmatter](lesson-frontmatter.md#verification-levels).

## Milestones

The work is planned in six milestones. Each issue belongs to one.

| Milestone          | Scope                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| `M1 Foundation`    | Repository, tooling, CI, design system, board data schemas and site skeleton |
| `M2 Modules 00-02` | Modules 00 to 02                                                             |
| `M3 Modules 03-05` | Modules 03 to 05                                                             |
| `M4 Modules 06-07` | Modules 06 and 07                                                            |
| `M5 Module 08`     | Module 08                                                                    |
| `M6 Modules 09-10` | Modules 09 and 10                                                            |

## Labels

| Prefix     | Values                                                                       | Rule                                            |
| ---------- | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| `type:*`   | `feat`, `content`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore` | Exactly one per issue.                          |
| `area:*`   | `site`, `anim`, `ui`, `boards`, `labs`, `docs`, `content`, `deps`            | At least one per issue.                         |
| `board:*`  | `rpi4`, `bbb`, `stm32mp157`                                                  | Every board the issue concerns, if any.         |
| `module:*` | `m00` to `m10`                                                               | Every course module the issue concerns, if any. |

The `type:*` values match the [commit types](commit-conventions.md#types). The label `good first issue` marks small, well-scoped tasks for new contributors.

## Issue forms

Open issues through the repository's issue forms: `lesson`, `animation`, `board`, `bug` and `inaccuracy`. Use the `inaccuracy` form for a technical error you find outside your current task, instead of fixing it in passing.
