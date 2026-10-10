<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Architecture

Embedded Academy is a static site built from a pnpm workspace. Lessons, board data, animations and design tokens live in separate packages, and the site assembles them at build time. Nothing runs on a server when a learner reads a lesson.

```{mermaid}
flowchart LR
  boards["packages/boards<br/>board data + Zod schemas"]
  anim["packages/anim<br/>animation components"]
  ui["packages/ui<br/>tokens, fonts, base components"]
  content["content/courses<br/>MDX lessons"]
  logs["logs/<br/>real serial captures"]
  labs["labs/<br/>container + QEMU"]
  site["apps/site<br/>Astro"]
  pages["Cloudflare Pages"]
  docs["docs/<br/>Sphinx + MyST"]
  rtd["Read the Docs"]

  boards --> anim
  ui --> anim
  boards --> site
  anim --> site
  ui --> site
  content --> site
  logs --> content
  labs --> logs
  site --> pages
  docs --> rtd
```

## Board data is the single source of facts

Every address, stage, file name and size that a lesson or animation shows comes from `packages/boards`. Each fact carries a `source` field, and Zod schemas validate the data.

This keeps facts in one place. When a fact is wrong, one fix in the board data corrects every lesson and animation that uses it, and the fix's pull request shows its new source.

## Animations draw data, they don't own it

Components in `packages/anim`, such as `BootChain` and `MemoryMap`, receive board data and turn it into anime.js v4 timelines. A component never hard-codes a value. The same component therefore serves all three boards, and a reviewer checks facts in one place instead of in every component.

## Lessons are MDX with typed frontmatter

Lessons in `content/courses/` are MDX files. Their frontmatter follows a schema that the site enforces, so a lesson without a Diátaxis type, a verification level or sources fails the build instead of shipping. Lessons embed animation components and console replays.

## Console output is replayed, not typed

Console blocks replay real serial captures from `logs/` in an xterm.js terminal. A learner sees what the board printed, not a reconstruction. The `labs/` container produces captures for what QEMU emulates; captures from real boards cover the rest.

## The design system sits under everything

`packages/ui` holds the tokens, fonts and base components. The site and the animation components use colours only through tokens, so the dark TTY theme and the light Paper theme stay consistent, and contrast is checked in one place.

## The site and the docs deploy separately

Cloudflare Pages builds the site from GitHub, with a preview deployment for each pull request. Read the Docs builds these project docs. The two have different readers: learners read the site, contributors read the docs.

## Related decisions

- [ADR 0003: emulation-first labs](decisions/0003-emulation-first-labs.md)
- [ADR 0005: site stack and hosting](decisions/0005-site-stack-and-hosting.md)
- [ADR 0007: project docs](decisions/0007-project-docs.md)
- [ADR 0009: design system](decisions/0009-design-system.md)
