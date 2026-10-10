<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Build the site locally

In this tutorial you clone the repository, run the course site on your machine, and build these docs. At the end you have the site open in your browser and an HTML copy of the docs on disk.

Plan for about 20 minutes, most of it spent downloading dependencies.

:::{note}
The root scripts used here arrive with the M1 scaffold. If `pnpm dev` or `pnpm docs:build` reports a missing script, your checkout predates the scaffold. Pull the latest `main` and try again.
:::

## Install the tools first

You need four tools. Install each one with your system's usual method, then check its version.

Node.js 24
: Runs the site build. The repository's `.nvmrc` names the version. Check with `node --version`.

pnpm
: Manages the workspace. Node.js ships Corepack, which installs the pnpm version the repository asks for. Turn it on once with `corepack enable`.

Python 3.13 and uv
: Build the docs. Install [uv](https://docs.astral.sh/uv/), then run `uv python install 3.13`. Check with `uv --version`.

git
: Fetches the code. Check with `git --version`.

## Clone the repository

Clone the repository and move into it. Replace `<repository-url>` with the URL shown on the project's GitHub page under **Code**.

```bash
git clone <repository-url> embedded-academy
cd embedded-academy
```

## Install the workspace dependencies

Run pnpm from the repository root. It installs the dependencies of every package in the workspace.

```bash
pnpm install
```

The first install takes a few minutes. It also installs the git hooks configured in `lefthook.yml`.

## Start the development server

Start the site in development mode.

```bash
pnpm dev
```

When the server is ready, it prints a local URL. Open <http://localhost:4321> in your browser. You see the Embedded Academy home page.

Leave the server running. When you save a change, the server rebuilds the page and your browser shows the new version.

Stop the server with {kbd}`Ctrl+C` when you are done.

## Build the docs

The docs use Sphinx, which runs under Python. You do not need to create a virtual environment: uv reads the pinned requirements and runs Sphinx in a temporary one.

```bash
pnpm docs
```

The build treats every warning as an error. When it finishes, open `docs/_build/html/index.html` in your browser. You see the page you are reading now.

## What you have now

You have:

- the course site running from your own checkout
- a local build of the project docs

Next, read [Write a lesson](../how-to/write-a-lesson.md) to add content, or [Commands](../reference/commands.md) for the other scripts you can run.
