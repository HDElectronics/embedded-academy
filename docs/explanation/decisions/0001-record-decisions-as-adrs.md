<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# 0001 Record decisions as ADRs

- Status: accepted
- Date: 2026-10-11
- Deciders: the Embedded Academy maintainer

## Context and problem statement

Embedded Academy is an open-source project. Contributors, human and AI, join at different times and need to know why the stack, the layout and the rules are what they are. Without a record, a decision lives only in someone's memory or in a chat thread, and it gets reopened or broken by accident.

How should the project record its decisions?

## Decision drivers

- A newcomer can find the reason for a rule in minutes.
- A decision changes deliberately, never by drift.
- The record lives in the repository and is reviewed like code.

## Considered options

- Architecture decision records in MADR format, in `docs/explanation/decisions/`
- A wiki page outside the repository
- No formal record; reasons live in pull request descriptions

## Decision outcome

Chosen option: architecture decision records in [MADR](https://adr.github.io/madr/) format, stored in `docs/explanation/decisions/` and numbered from `0001`.

A change that alters a rule in `AGENTS.md`, the stack or the repository layout needs an ADR, and `AGENTS.md` is updated in the same pull request. An accepted ADR is never rewritten; a new ADR supersedes it.

### Consequences

- Good: decisions are versioned, reviewed and published with the docs.
- Good: agents and contributors can cite an ADR when a rule is questioned.
- Bad: a structural change costs one more document in its pull request.
