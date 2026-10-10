<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# 0004 Publish in English only

- Status: accepted
- Date: 2026-10-11
- Deciders: the Embedded Academy maintainer

## Context and problem statement

Translations widen the audience, but every translated page is a second copy of every fact. A correction in one language can miss the others, and the accuracy rules apply to each copy.

Which languages should the courses and docs use?

## Decision drivers

- Every fact has one copy to source, review and correct.
- The upstream material the courses cite (TRMs, kernel, U-Boot, TF-A and OP-TEE docs) is in English.

## Considered options

- English only
- English plus translations from the start
- English first, with a translation framework ready for later

## Decision outcome

Chosen option: English only, for the site, the lessons and the docs.

### Consequences

- Good: one copy of each fact keeps the accuracy rules enforceable.
- Good: lessons use the same terms as the sources they cite.
- Bad: learners who don't read English are not served. Adding a language later needs a new ADR.
