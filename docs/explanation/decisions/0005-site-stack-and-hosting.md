<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# 0005 Build a static Astro site on Cloudflare Pages

- Status: accepted
- Date: 2026-10-11
- Deciders: the Embedded Academy maintainer

## Context and problem statement

The courses mix long prose with animated diagrams and console replays. The site has to render lessons written by many contributors, keep the animations driven by validated board data, and stay fast without a server to run.

Which stack and hosting should the site use?

## Decision drivers

- Lessons are written in Markdown, with components where prose isn't enough.
- Types catch errors in board data and component props before they ship.
- The site is static: no server to secure or pay for.
- Every pull request gets a preview a reviewer can open.

## Considered options

- Astro with MDX and TypeScript, hosted on Cloudflare Pages
- A single-page application framework with client-side routing
- A documentation generator with custom plugins for the animations

## Decision outcome

Chosen option:

- **Astro** with **MDX** for lessons, as a static site.
- **TypeScript** in strict mode.
- **anime.js v4** for animations and **xterm.js** for console replays.
- A **pnpm** workspace for the site and its packages.
- Hosting on **Cloudflare Pages** through its GitHub integration, which deploys `main` and builds a preview for each pull request.

Adding another framework, animation library, CSS framework or runtime dependency needs the maintainer's approval.

### Consequences

- Good: lessons stay Markdown, and components drop in where a diagram or replay helps.
- Good: pages ship as static files, with JavaScript only where an animation needs it.
- Good: reviewers check every change in a preview deployment.
- Bad: the site depends on Cloudflare Pages for hosting and previews. Moving host needs a new ADR.
