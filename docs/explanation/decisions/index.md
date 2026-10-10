<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Architecture decision records

An architecture decision record (ADR) captures one decision: the problem, the options, the choice and its consequences. The project writes them in the [MADR](https://adr.github.io/madr/) format.

Read an ADR to learn why a rule exists. Write one when a change alters a rule in `AGENTS.md`, the stack or the repository layout, and update `AGENTS.md` in the same pull request. An accepted ADR changes only through a new ADR that supersedes it, with the maintainer's approval.

## How a decision changes

A new ADR starts with the status `proposed` and takes the next free number. The maintainer accepts it by merging its pull request. An accepted ADR is never rewritten; a later ADR supersedes it and says so. The history of a rule therefore stays readable: you can follow a chain of ADRs to see what changed and why.

## Records

| ADR                                       | Decision                                      | Status   |
| ----------------------------------------- | --------------------------------------------- | -------- |
| [0001](0001-record-decisions-as-adrs.md)  | Record decisions as ADRs                      | accepted |
| [0002](0002-three-boards.md)              | Teach on three boards                         | accepted |
| [0003](0003-emulation-first-labs.md)      | Run labs under emulation first                | accepted |
| [0004](0004-english-only.md)              | Publish in English only                       | accepted |
| [0005](0005-site-stack-and-hosting.md)    | Build a static Astro site on Cloudflare Pages | accepted |
| [0006](0006-git-workflow.md)              | Use GitHub Flow and Conventional Commits      | accepted |
| [0007](0007-project-docs.md)              | Write project docs with Sphinx and Diátaxis   | accepted |
| [0008](0008-licensing.md)                 | License code MIT and content CC-BY-SA-4.0     | accepted |
| [0009](0009-design-system.md)             | Make the site look like a Linux terminal      | accepted |
| [0010](0010-github-project-tracking.md)   | Track work in a GitHub Project                | accepted |
| [0011](0011-top-level-tooling-folders.md) | Keep scripts and e2e tests at the top level   | accepted |
| [0012](0012-typescript-6.md)              | Pin TypeScript 6 for now                      | accepted |

```{toctree}
:hidden:
:maxdepth: 1

0001-record-decisions-as-adrs
0002-three-boards
0003-emulation-first-labs
0004-english-only
0005-site-stack-and-hosting
0006-git-workflow
0007-project-docs
0008-licensing
0009-design-system
0010-github-project-tracking
0011-top-level-tooling-folders
0012-typescript-6
```
