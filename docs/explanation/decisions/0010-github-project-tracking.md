<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# 0010 Track work in a GitHub Project

- Status: accepted
- Date: 2026-10-11
- Deciders: the Embedded Academy maintainer

## Context and problem statement

Work spans code, lessons, labs and research into hardware facts. Content work has a property code work doesn't: how far its facts have been verified. The project needs one place to see what is planned, in progress and done, including that verification state.

How should the project track its work?

## Decision drivers

- Tracking lives next to the code, issues and pull requests.
- Content issues show their verification level.
- Status changes follow pull requests without manual updates.
- New issues arrive with the information a triager needs.

## Considered options

- A GitHub Project with custom fields, milestones and issue forms
- An external tracker
- Plain issues and labels without a project

## Decision outcome

Chosen option: the **Embedded Academy** GitHub Project.

- Fields: **Status**, **Priority** (`P0` to `P2`), **Size** (`S`, `M`, `L`; an `L` is split before work starts) and **Verification** (`unverified`, `emulated`, `hardware`).
- Milestones **M1** to **M6**.
- Labels with the prefixes `type:*`, `area:*`, `board:*` and `module:*`.
- Issue forms for new issues, including an `inaccuracy` form for technical errors.

`scripts/github/setup-project.sh` creates the project, fields, milestones and labels.

### Consequences

- Good: the board shows verification progress across all content.
- Good: linking a pull request with `Closes #N` moves its issue through the board.
- Bad: project commands need the `project` token scope in `gh`, which contributors must add with `gh auth refresh -s project`.
