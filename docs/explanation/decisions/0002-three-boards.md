<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# 0002 Teach on three boards

- Status: accepted
- Date: 2026-10-11
- Deciders: the Embedded Academy maintainer

## Context and problem statement

The first course, `linux-boot-arm`, teaches how Linux boots on ARM. Boot chains differ a lot between SoC families, so a course built on a single board teaches one vendor's choices as if they were universal. Every extra board, though, multiplies the facts to source, the logs to capture and the labs to maintain.

Which boards should the courses cover?

## Decision drivers

- Learners see more than one way to boot, so they can tell the general from the vendor-specific.
- Each board is affordable and documented well enough to cite.
- The number of boards stays small enough to keep every fact sourced.

## Considered options

- One board
- Three boards from different SoC families
- An open list of boards contributed by the community

## Decision outcome

Chosen option: three boards.

- **Raspberry Pi 4** is the main board. Differences on the Raspberry Pi 5 get a side page, not a separate track.
- **BeagleBone Black**, built on the TI AM335x.
- **STM32MP157 DK2**, from ST.

Board data uses the identifiers `rpi4`, `bbb` and `stm32mp157`.

### Consequences

- Good: lessons can contrast three boot chains and show what they share.
- Good: the Raspberry Pi 4 gives most learners a board they may already own.
- Bad: every board-specific fact needs three sources and, ideally, three captured logs.
- Bad: adding a fourth board needs a new ADR that supersedes this one.
