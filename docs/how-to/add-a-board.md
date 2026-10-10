<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Add a board

This guide adds a new board to the platform. The supported boards are a recorded decision, so a new board starts with an ADR, not with code.

## Get the decision accepted first

1. Open an issue with the `board` issue form. Name the board and say why the courses need it.
2. Ask the maintainer. [ADR 0002](../explanation/decisions/0002-three-boards.md) fixes the board list, and changing an ADR decision needs their approval.
3. Write a new ADR in `docs/explanation/decisions/` that supersedes or amends ADR 0002. Say how labs will run on the board: under QEMU, or on `virt` with simulated board steps and captured logs, as [ADR 0003](../explanation/decisions/0003-emulation-first-labs.md) describes.
4. Update the board list in `AGENTS.md` in the same pull request as the ADR.

## Add the board data

Board data lives in `packages/boards`, next to `rpi4`, `bbb` and `stm32mp157`.

1. Add the board's data and extend the Zod schemas so the new board validates.
2. Give every fact a `source` field that points to the vendor TRM, datasheet, upstream docs or upstream code. Never invent an address, offset or size. If a value is unknown, leave it out and open a research issue.
3. Add the board's identifier to the `boards` values that lesson frontmatter accepts, and update [Lesson frontmatter](../reference/lesson-frontmatter.md).
4. Add Vitest tests for the new data. Keep coverage on `packages/boards` at or above 90%.

## Add the board to labs and logs

1. If QEMU emulates the board, add its lab scripts under `labs/`. If it doesn't, document which steps the lab simulates in the browser.
2. Capture real serial logs from the board into `logs/`. Each file starts with a header: board and revision, software versions and capture date.

## Add the tracking label

Add a `board:*` label for the new board so you can filter issues by it. See [Set up the GitHub Project](set-up-the-github-project.md).

## Check and open the pull requests

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm docs:build` and `pnpm reuse`. Title the data pull request `feat(boards): ...`. Keep each pull request under 400 changed lines by stacking them: the ADR first, then the data, then the labs.
