<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Copilot, Cursor and others) working on this repository. Human contributors follow the same rules; the long-form versions live in `docs/`. These rules hold unless the maintainer overrides them in the conversation. If a rule here and a file in `docs/` disagree, stop and ask.

## Project

Embedded Academy is an open-source platform of interactive, animated courses on embedded systems.

- The first course is `linux-boot-arm`: how Linux boots on ARM, from the first instruction in the boot ROM to PID 1. It covers TrustZone, TF-A, OP-TEE, U-Boot, the device tree and the kernel's start, and how to build each piece.
- Boards: **Raspberry Pi 4** (main; Pi 5 differences get a side page), **BeagleBone Black** (AM335x), **STM32MP157 DK2**.
- Audience: three depths in every lesson. A base path for Linux users new to embedded, deeper panels for practitioners and experts.
- Language: English only.
- Labs are emulation-first: a container with cross toolchains and QEMU. QEMU emulates `raspi4b` and `virt`, not the AM335x or STM32MP1. For those boards, labs run on `virt`, board-specific steps are simulated in the browser, and output comes from captured real logs.
- Build path taught: every component by hand first, then Buildroot, then a Yocto overview.

## Stack

Astro + MDX, TypeScript 6 (strict; pinned until typescript-eslint supports TypeScript 7, see ADR 0012), anime.js v4 for animations, xterm.js for console replays, Shiki for code. pnpm workspace. Docs are Sphinx + MyST. Code is hosted on GitHub; the site is deployed on Cloudflare Pages and the docs on Read the Docs.

Do not add a framework, animation library, CSS framework or runtime dependency without asking the maintainer first. Dev-only tools that serve a rule below are fine; name them in the PR.

## Repository layout

```text
apps/site/                 Astro site: routes, layouts, search
content/courses/<slug>/    MDX lessons, one folder per module (00-orientation ...)
packages/boards/           board data + Zod schemas: rpi4, bbb, stm32mp157
packages/anim/             animation components (BootChain, MemoryMap, PrivilegeLadder ...)
packages/ui/               design system: tokens, fonts, base components
labs/                      lab container, QEMU scripts, lab sources
logs/                      real serial captures used by lessons
e2e/                       Playwright end-to-end and accessibility tests
scripts/                   repository automation (scripts/github/)
docs/                      Sphinx docs: tutorials/, how-to/, reference/, explanation/
.github/                   workflows, issue forms, PR template, CODEOWNERS
LICENSES/                  license texts (REUSE)
```

Put new files where this layout says. A new top-level folder needs an ADR.

## Commands

Run these before you say a change is done. The scripts are created by the M1 scaffold; if one is missing, say so instead of skipping it silently.

```bash
pnpm install
pnpm dev                      # site on localhost
pnpm lint                     # Biome, ESLint (astro/mdx), Stylelint, markdownlint, Vale
pnpm typecheck                # astro check + tsc
pnpm test                     # Vitest: schemas, logic, components
pnpm build                    # production build
pnpm e2e                      # Playwright: e2e and axe, desktop and phone
pnpm docs:build               # Sphinx docs; any warning fails
pnpm reuse                    # REUSE licensing check
```

Never skip hooks (`--no-verify`) and never disable a lint rule to make a check pass. If a check is wrong, fix the config in its own PR and explain why.

## Git workflow (GitHub Flow)

- `main` is always deployable and protected. Never push to it directly, never force-push a shared branch.
- One short-lived branch per issue, living under 3 days. Name: `<type>/<scope>-<what>`, lowercase, hyphens, at most 50 characters, optional issue number: `feat/anim-memory-map`, `content/m04-ddr-training`, `fix/42-boards-stm32-sysram`.
- Unfinished lessons merge early with `draft: true` in frontmatter, which keeps them out of production.
- Commits follow Conventional Commits:
  - Types: `feat`, `content` (lesson text, labs, logs), `fix` (including a wrong technical fact), `docs` (repo docs, not lessons), `refactor`, `test`, `build`, `ci`, `chore`.
  - Scopes: `site`, `anim`, `ui`, `boards`, `labs`, `deps`, `docs`, or a module `m00`...`m10`.
  - Subject in imperative mood, lowercase, no final period, at most 72 characters. The body says why. The footer carries `Refs #N` / `Closes #N` / `BREAKING CHANGE:`.
- Sign off every commit (DCO): `git commit -s`. Never add a sign-off for a person who did not write the change.
- Examples:

  ```text
  feat(anim): add MemoryMap relocation timeline
  content(m03): explain TZC-400 regions on STM32MP1
  fix(boards): correct BBB SRAM load address to 0x402F0400
  ```

## Pull requests

- One PR closes one issue. Its title is a Conventional Commit, because squash-merge makes it the commit on `main`.
- Aim for under 400 changed lines, excluding captured logs and lockfiles. Split bigger work into stacked PRs.
- Fill in the PR template checklist honestly. Leave a box unticked and say why rather than ticking it.
- Every required check must be green. Merge method: squash only.
- Visual changes include screenshots in dark and light, desktop and phone width.

## GitHub Project

All work is tracked in the **Embedded Academy** GitHub Project.

- Before starting, find or open the issue (use the issue forms) and move it to **In progress**.
- Set labels: one `type:*`, at least one `area:*`, `board:*` and `module:*` where they apply.
- Set project fields: Priority (P0-P2), Size (S, M; an L must be split first), Milestone (M1-M6), and Verification for content issues.
- Link the PR to its issue with `Closes #N`; the project's automation moves it to In review and Done.
- Found a technical error outside your task? Open an `inaccuracy` issue instead of fixing it in passing.

## Design system

The site looks like a Linux workstation: tmux panes, shell prompts, kernel log levels, systemd states. Tokens and components live in `packages/ui`; the reference is the Embedded Academy design system.

- Colours: only through tokens (`--bg`, `--surface`, `--ink`, `--accent`, `--world-secure` ...). No hex, rgb or named colours outside `packages/ui/tokens`. Stylelint enforces this.
- Palette is Tango. World colours are fixed across every course: `world-secure` yellow, `world-normal` cyan, `world-firmware` magenta.
- Type: Ubuntu Sans Mono for headings, UI and code. Ubuntu Sans for lesson prose, max 72ch. VT323 only for boot banners in hero animations.
- Layout from panes (`ea-pane`), not cards. Borders, not shadows. Radius 0 for panes, code, console and callouts; 2px only for buttons and tags.
- Buttons are bracketed text (`[ Play boot ]`), one primary per pane. No icon fonts, no emoji anywhere.
- Terminal vocabulary only where it is true: `[  OK  ]` marks a stage that finished, `<4> warning` marks a real warning, a prompt shows a real command.
- No CRT effects: no scanlines, glow or flicker.
- Default theme is TTY (dark); Paper (light) must work equally. Text meets 4.5:1, control borders and focus rings 3:1, in both themes.
- Colour never carries meaning alone: pair it with a word (`S-EL1`, `FAILED`) or a marker (`*`).
- Focus ring: 2px solid `--focus`, offset 2px, on every interactive element.

## Animations

- Built with anime.js v4 in `packages/anim`, driven by data from `packages/boards`. Never hard-code an address, stage, file name or size in a component.
- Durations: 150ms for state changes, 300ms for a stage transition, 600ms for travel across a diagram. Ease out on entry, ease in-out on travel. Console replay at about 30 characters per second.
- Every animation has a stepped mode with Play, Pause, Previous and Next, and full keyboard control.
- With `prefers-reduced-motion`, stages switch instantly, the cursor stops blinking, and Play becomes Next.
- Each step must read correctly at rest. Never put information only in a mid-animation frame.
- Tests check end states and step boundaries with timers mocked.

## Lesson content

- Every page has exactly one Diataxis type in frontmatter: `tutorial`, `how-to`, `reference` or `explanation`. A module has a lab (tutorial), concept pages (explanation), build recipes (how-to) and board facts (reference).
- Voice: address the learner as "you". Short, active sentences. Headings in sentence case that state the point ("U-Boot relocates itself").
- Commands, files, registers and config symbols go in `code`. Names as upstream spells them: U-Boot, TrustZone, TF-A, OP-TEE, Device Tree (prose) / `dtb` (files).
- Addresses: `0x` + uppercase hex. Diagrams may group with `_` (`0x402F_0400`); code and logs keep the tool's spelling.
- Commands go in a Prompt block, one command each; logs in a SerialConsole block; files in a CodeBlock with the real upstream path, marked `(simplified)` when cut.
- Asides use kernel log levels only: `<6> info`, `<4> warning`, `<3> error`.

## Technical accuracy (most important)

A wrong address or stage order teaches learners something false. Treat these rules as hard requirements.

- Never invent an address, register value, offset, log line, command output, defconfig name, file name or version. If you are not sure, write it as unverified and open an `inaccuracy` or research issue. Do not guess.
- Every fact a learner could act on cites a source: in board data the `source` field, in lessons the frontmatter `sources` list plus a footnote. Preferred sources, in order: vendor TRM or datasheet, upstream docs (kernel, U-Boot, TF-A, OP-TEE), upstream source code, vendor app notes. Blog posts and forum answers are never the citation.
- Every command, lab and log carries a verification level: `hardware` (run on the board), `emulated` (run in the lab container under QEMU), or `unverified`. Only claim `emulated` if you actually ran it in the lab container in this change.
- Console output in lessons is replayed from files in `logs/`, never typed by hand. Each log file starts with a header: board and revision, software versions, capture date.
- Each course pins the upstream versions it teaches. A version bump is its own PR and re-runs every `emulated` lab.

## Testing

- Board data: Zod schemas plus Vitest. Coverage target 90% on `packages/boards`.
- Logic and components: Vitest + Testing Library. End-to-end, visual regression and accessibility: Playwright with axe. Performance budgets: Lighthouse CI.
- A bug fix starts with a failing test that reproduces it.
- Don't add tests that only raise coverage numbers.

## Documentation

- Docs are Sphinx + MyST Markdown in `docs/`, organised by Diataxis: `tutorials/`, `how-to/`, `reference/`, `explanation/`. Put each page in the one folder that matches its purpose.
- Docs change in the same PR as the code or process they describe.
- A decision that changes a rule in this file, the stack or the layout needs an ADR in `docs/explanation/decisions/` (MADR format) and an update to this file in the same PR.
- `CHANGELOG.md` is generated by release-please. Never edit it by hand.
- Reference pages generated from code (board schema, design tokens) are never edited by hand; change the source.

## Licensing (REUSE)

- Code (site, components, board data, lab scripts): `MIT`. Lessons, docs, diagrams, captured logs: `CC-BY-SA-4.0`.
- Every new file starts with SPDX tags in its comment syntax:

  ```text
  SPDX-FileCopyrightText: Embedded Academy contributors
  SPDX-License-Identifier: MIT
  ```

  Files that can't hold comments (JSON, images) are covered in `REUSE.toml`.
- Code quoted from upstream projects keeps its original license and copyright line (for example `GPL-2.0-only` for kernel and U-Boot code). Never relicense it.
- Never copy code or text from a source whose license you don't know.

## Releases

release-please opens release PRs from Conventional Commits. SemVer, `0.x` until the first course is complete. `feat` bumps minor; `fix` and `content` bump patch; `BREAKING CHANGE` (such as a changed lesson URL) bumps major. Lesson URLs are permanent: a moved lesson leaves a redirect.

## Definition of done

- [ ] Linked issue, correct labels and project fields
- [ ] Branch name and commits follow the conventions, commits signed off
- [ ] Lint, typecheck, tests, build, e2e and docs build all pass locally
- [ ] New files carry SPDX tags; `reuse lint` passes
- [ ] Tokens only, both themes checked, keyboard and reduced motion work
- [ ] Facts cited, verification levels set honestly, logs from `logs/`
- [ ] Docs and ADRs updated in the same PR
- [ ] PR under 400 lines, template filled in, screenshots for visual changes

## Ask the maintainer before you

- add a runtime dependency, framework or service
- change CI, branch protection, secrets, hosting or the license
- delete or rename lessons, URLs or published files
- mark anything `hardware`-verified (only a person with the board can)
- change a decision recorded in an ADR
