<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Write a lesson

This guide takes a lesson from an issue to a merged pull request. It assumes you know which module the lesson belongs to.

## Start from an issue

1. Find the issue for the lesson, or open one with the `lesson` issue form.
2. Set the labels: one `type:*`, at least one `area:*`, and the `module:*` and `board:*` labels that apply.
3. Set the project fields Priority, Size, Milestone and Verification. See [Project fields](../reference/project-fields.md).
4. Move the issue to **In progress**.

## Create a branch for the lesson

Name the branch `content/<module>-<topic>`, for example `content/m04-ddr-training`. Keep it lowercase, with hyphens, at most 50 characters. You can add the issue number: `content/57-m04-ddr-training`.

```bash
git switch -c content/m04-ddr-training
```

## Add the MDX file

Lessons live in `content/courses/<course>/`, with one folder per module (`00-orientation`, ...). Create your `.mdx` file in the module's folder.

Start the file with its SPDX tags, then the frontmatter. Set `draft: true` until the lesson is complete. Drafts merge to `main` but stay out of production.

```yaml
title: U-Boot relocates itself
description: Why U-Boot copies itself to a new place in RAM and what changes afterwards.
course: linux-boot-arm
module: m05
order: 3
type: explanation
boards: [rpi4, bbb, stm32mp157]
verification: unverified
sources:
  - title: U-Boot documentation
    url: https://docs.u-boot.org/en/latest/
draft: true
```

The example values are placeholders, not a plan for module `m05`. [Lesson frontmatter](../reference/lesson-frontmatter.md) lists every field and its rules.

## Write to the house style

- Give the page exactly one Diátaxis type and write only that kind of content on it. A module's lab is a tutorial, its concepts are explanations, its build recipes are how-to guides and its board facts are reference.
- Write for three depths: a base path for Linux users new to embedded, and deeper panels for practitioners and experts.
- Address the learner as "you". Use short, active sentences.
- Write headings in sentence case that state the point.
- Put commands, files, registers and config symbols in `code`. Spell names as upstream does: U-Boot, TrustZone, TF-A, OP-TEE, Device Tree in prose and `dtb` for files.
- Write addresses as `0x` plus uppercase hex. Code and logs keep the tool's spelling.
- Put each command in its own Prompt block, logs in a SerialConsole block, and files in a CodeBlock with the real upstream path. Mark shortened files `(simplified)`.
- Use asides with kernel log levels only: `<6> info`, `<4> warning`, `<3> error`.

## Cite every fact a learner could act on

Add each source to the `sources` frontmatter list and cite it with a footnote where you state the fact. Prefer, in order: the vendor TRM or datasheet, upstream docs, upstream source code, vendor app notes. Never cite a blog post or a forum answer.

If you can't find a source, don't guess. Mark the claim as unverified and open a research or `inaccuracy` issue. [Accuracy policy](../explanation/accuracy-policy.md) explains why.

## Replay real logs, never typed ones

Console output comes from files in `logs/`. Each file starts with a header that names the board and revision, the software versions and the capture date. If the log you need doesn't exist yet, open an issue for it instead of writing one by hand.

## Set the verification level honestly

Set `verification` to the level you actually reached:

- `emulated` only if you ran every command in the lab container under QEMU in this change.
- `hardware` only if a person ran it on the board. Ask the maintainer before you set it.
- `unverified` in every other case.

## Check the lesson and open the pull request

1. Preview the lesson with `pnpm dev`.
2. Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`. Fix every failure.
3. Run `pnpm reuse` to check the SPDX tags.
4. Commit with the `content` type and sign off: `git commit -s -m "content(m04): explain ddr training"`.
5. Push and open a pull request. Its title is a Conventional Commit; its body says `Closes #N`.
6. Fill in the PR template checklist. Leave a box unticked and say why rather than ticking it.

When the lesson is complete, a follow-up pull request sets `draft: false`.
