<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Embedded Academy

Embedded Academy is an open-source platform of interactive, animated courses on embedded systems.

The first course, `linux-boot-arm`, shows how Linux boots on ARM: from the first instruction in the boot ROM to PID 1. It covers TrustZone, TF-A, OP-TEE, U-Boot, the Device Tree and the kernel's start, and how to build each piece. You follow it on three boards:

- Raspberry Pi 4, with a side page for Raspberry Pi 5 differences
- BeagleBone Black
- STM32MP157 DK2

Labs run in a container with cross toolchains and QEMU, so you don't need a board to start.

## Status

Milestone M1, the project scaffold, is in progress. The site, the tooling and these docs are being set up; there are no published lessons yet.

## Quick start

You need Node.js 24, pnpm (through `corepack enable`), Python 3.13 with [uv](https://docs.astral.sh/uv/), and git.

```bash
git clone <repository-url> embedded-academy
cd embedded-academy
pnpm install
pnpm dev
```

Open <http://localhost:4321>. To build the project docs, run `pnpm docs:build` and open `docs/_build/html/index.html`.

The full walk-through is in [Build the site locally](docs/tutorials/build-the-site-locally.md).

## Documentation

The project docs follow [Diátaxis](https://diataxis.fr/):

- [Tutorials](docs/tutorials/index.md): a guided first run.
- [How-to guides](docs/how-to/index.md): write a lesson, add a board, cut a release.
- [Reference](docs/reference/index.md): commands, commit conventions, lesson frontmatter, licensing.
- [Explanation](docs/explanation/index.md): architecture, the accuracy policy and the [decision records](docs/explanation/decisions/index.md).

AI coding agents and human contributors follow the same rules, collected in [AGENTS.md](AGENTS.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). To report a vulnerability, follow [SECURITY.md](SECURITY.md).

## License

- Code (site, components, board data, lab scripts) is licensed under `MIT`.
- Lessons, docs, diagrams and captured logs are licensed under `CC-BY-SA-4.0`.
- Code quoted from upstream projects keeps its original license.

Each file states its license in SPDX tags, following [REUSE](https://reuse.software/). See [Licensing](docs/reference/licensing.md) for details.
