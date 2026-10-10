<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# 0003 Run labs under emulation first

- Status: accepted
- Date: 2026-10-11
- Deciders: the Embedded Academy maintainer

## Context and problem statement

Each module has a lab. Many learners don't own all three boards, and some own none. A lab that needs hardware locks them out, and a lab that runs differently on every machine is hard to support.

How should labs run?

## Decision drivers

- A learner can do every lab without buying hardware.
- Labs behave the same on every machine.
- Labs never claim to show a board's behaviour that they don't reproduce.

## Considered options

- Hardware-only labs
- Emulation-first labs in a container, with honest fallbacks where emulation stops
- Browser-only simulations

## Decision outcome

Chosen option: emulation-first labs.

Labs run in a container that holds the cross toolchains and QEMU. QEMU emulates the `raspi4b` and `virt` machines. It doesn't emulate the AM335x or the STM32MP1, so for the BeagleBone Black and the STM32MP157 DK2:

- the lab runs on `virt`,
- the browser simulates the board-specific steps,
- the console shows captured logs from the real board.

Every lab step states its verification level: `unverified`, `emulated` or `hardware`.

### Consequences

- Good: every learner can run every lab on their own machine.
- Good: the container pins the toolchain and QEMU versions, so results repeat.
- Bad: for two of the three boards, part of each lab is a simulation. Lessons must say which part.
- Bad: captured logs must be collected from real boards and kept in `logs/`.
