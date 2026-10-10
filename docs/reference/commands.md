<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Commands

Run every command from the repository root. The root `package.json` defines these scripts; run each one as `pnpm <script>`.

## Site scripts

`pnpm dev`
: Starts the Astro development server on <http://localhost:4321>.

`pnpm build`
: Builds the design tokens in `packages/ui`, then the production site.

`pnpm preview`
: Serves the production build locally. Run `pnpm build` first.

## Quality scripts

`pnpm lint`
: Runs every `lint:*` script in turn: Biome, ESLint, Prettier (check only, for `.astro` and `.mdx`), Stylelint, markdownlint and Vale. Fails on any finding.

`pnpm lint:fix`
: Applies the automatic fixes of Biome, ESLint, Prettier and Stylelint. Fix markdownlint and Vale findings by hand.

`pnpm format`
: Formats files in place with Biome and, for `.astro` and `.mdx`, Prettier.

`pnpm typecheck`
: Runs the `typecheck` script of every workspace package in parallel.

## Test scripts

`pnpm test`
: Runs the Vitest suites: schemas, logic and components.

`pnpm test:coverage`
: Runs the Vitest suites and reports coverage. The target on `packages/boards` is 90%.

`pnpm e2e`
: Runs Playwright: end-to-end, visual regression and accessibility checks with axe.

## Docs scripts

`pnpm docs:build`
: Builds these docs to `docs/_build/html`. Warnings fail the build. It runs:

  ```bash
  uv run --with-requirements docs/requirements.txt sphinx-build -W --keep-going -b html docs docs/_build/html
  ```

`pnpm docs:linkcheck`
: Checks the links in these docs with the Sphinx `linkcheck` builder. The report goes to `docs/_build/linkcheck`.

## Licensing script

`pnpm reuse`
: Checks that every file carries license information. It runs:

  ```bash
  uvx --from "reuse[charset-normalizer]" reuse lint
  ```

## Run these before you call a change done

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
pnpm docs
pnpm reuse
```

If a script is missing from your checkout, say so in the pull request instead of skipping it silently.

## Regenerate the docs requirements

`docs/requirements.in` lists the top-level docs dependencies. After you change it, regenerate the pinned file:

```bash
uv pip compile --universal --python-version 3.13 docs/requirements.in -o docs/requirements.txt
```

uv rewrites the whole file, so add the two SPDX lines back at its top.
