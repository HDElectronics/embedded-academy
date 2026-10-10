<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Accuracy policy

Accuracy is the project's most important rule. This page explains why the rules are strict and how they fit together.

## A wrong fact teaches something false

A learner who reads a load address or a stage order will act on it. They type it into a U-Boot prompt, write it into a linker script or repeat it in an interview. A wrong value doesn't look wrong; it looks like any other fact on the page. The learner pays for it later, often far from the lesson that caused it.

So the project treats an invented fact as worse than a missing one. A gap is visible and someone can fill it. A plausible guess hides.

## Never guess, mark it unverified

When you aren't sure of an address, a register value, a log line, a defconfig name or a version, you don't write a best guess. You mark the claim as unverified and open an `inaccuracy` or research issue. The issue makes the gap visible in the GitHub Project, where someone with the right documents or the right board can close it.

## Sources follow a fixed order of trust

Every fact a learner could act on cites a source. The project prefers, in order:

1. The vendor's technical reference manual or datasheet.
2. Upstream documentation: the kernel, U-Boot, TF-A, OP-TEE.
3. Upstream source code.
4. Vendor application notes.

Blog posts and forum answers are never the citation. They can point you to the right document, but the lesson cites the document.

The order reflects who answers for the fact. The vendor answers for its silicon; upstream projects answer for their code. A blog author answers for neither, and their post doesn't change when the upstream behaviour does.

## Verification levels say what was actually run

A cited fact can still fail in practice: a command can need a flag the docs forgot, or an output can differ between versions. So every command, lab and log carries one of three levels:

`unverified`
: Nobody has run it yet.

`emulated`
: Someone ran it in the lab container under QEMU, in the change that set the level.

`hardware`
: A person ran it on the board.

The levels are a promise to the learner, so they are never set optimistically. Only a person with the board can claim `hardware`, and only someone who ran the lab in that change can claim `emulated`.

## Logs are captured, never typed

Console output in lessons comes from files in `logs/`. A hand-typed log looks real and can be wrong in ways nobody notices: a missing line, a reordered message, a version string from a different build. A captured log carries a header with the board and revision, the software versions and the capture date, so a reader can tell exactly what produced it.

## Versions are pinned

Boot software changes between releases: options move, defaults change, messages are reworded. Each course pins the upstream versions it teaches, so its facts and its logs describe one consistent set of software. A version bump is its own pull request and re-runs every `emulated` lab.

## Fixing a wrong fact is a bug fix

A wrong technical fact is a bug, and its fix uses the `fix` commit type. When you find one outside your current task, open an `inaccuracy` issue instead of fixing it in passing. The issue records the error, so reviewers can check whether the same mistake appears elsewhere.
