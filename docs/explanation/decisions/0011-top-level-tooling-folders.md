<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# 0011 Keep repository scripts and end-to-end tests in top-level folders

- Status: accepted
- Date: 2026-10-11
- Deciders: the Embedded Academy maintainer

## Context and problem statement

The M1 scaffold added two folders the original layout did not list: `scripts/` for repository automation (the GitHub Project setup script) and `e2e/` for Playwright tests that drive the built site. AGENTS.md requires an ADR for any new top-level folder.

Where should repository automation and browser tests live?

## Decision drivers

- Contributors and agents should find tooling without reading a package's internals.
- End-to-end tests exercise the whole site, not one package.

## Considered options

- Top-level `scripts/` and `e2e/`
- `apps/site/e2e/` and a `tools` workspace package

## Decision outcome

Chosen option: top-level `scripts/` and `e2e/`. `scripts/` holds automation that runs outside the build, grouped by service (`scripts/github/`). `e2e/` holds Playwright specs run by `pnpm e2e` against `apps/site/dist`.

### Consequences

- Good: `pnpm e2e` and the setup script are where a newcomer looks first.
- Bad: two more top-level folders. New ones still need an ADR.
