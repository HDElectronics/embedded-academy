<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# 0006 Use GitHub Flow and Conventional Commits

- Status: accepted
- Date: 2026-10-11
- Deciders: the Embedded Academy maintainer

## Context and problem statement

Many contributors change code, lessons and logs at once. The history must show what changed and why, releases must be generated without manual bookkeeping, and every contribution must be clearly licensed by its author.

Which branching model, commit convention and contribution terms should the project use?

## Decision drivers

- `main` is always deployable.
- Release versions and the changelog come from the history, not from a person.
- Lesson changes are distinguishable from code changes in the history.
- Contributors certify their right to submit their work, without a separate agreement to sign.

## Considered options

- GitHub Flow with Conventional Commits, squash merge and the DCO
- Git Flow with long-lived `develop` and release branches
- Free-form commits with a contributor license agreement

## Decision outcome

Chosen option:

- **GitHub Flow**: one short-lived branch per issue, merged into a protected `main` through a pull request.
- **Conventional Commits**, with an extra `content` type for lessons, labs and logs.
- **Squash merge** only, so the pull request title becomes the commit on `main`.
- **DCO** sign-off on every commit with `git commit -s`, certifying the [Developer Certificate of Origin](https://developercertificate.org/).

### Consequences

- Good: release-please can compute versions and the changelog from `main`.
- Good: the `content` type separates lesson work from code in the history and the changelog.
- Good: each pull request is one commit, easy to revert.
- Bad: contributors must learn the commit format.
- Bad: a commit without a sign-off must be amended before it merges.
