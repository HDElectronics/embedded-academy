<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# 0012 Pin TypeScript 6 until the lint toolchain supports TypeScript 7

- Status: accepted
- Date: 2026-10-11
- Deciders: the Embedded Academy maintainer

## Context and problem statement

TypeScript 7 is the native compiler. During the M1 scaffold, typescript-eslint (used to parse `.astro` files) reported that it does not support TypeScript 7, and ESLint crashed while loading it.

Which TypeScript version should the workspace use?

## Decision drivers

- `pnpm lint` and `pnpm typecheck` must pass on every commit.
- One TypeScript version across the workspace.

## Considered options

- TypeScript 6.0, pinned
- TypeScript 7, with ESLint dropped for `.astro` files

## Decision outcome

Chosen option: TypeScript 6.0, pinned in the root and site `package.json`. Revisit when typescript-eslint supports TypeScript 7 (tracked upstream in typescript-eslint issue 10940).

### Consequences

- Good: lint and typecheck work today with the same compiler.
- Bad: we miss the native compiler's speed until the upgrade. Renovate will propose it; this ADR must be superseded first.
