<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# 0007 Write project docs with Sphinx and Diátaxis

- Status: accepted
- Date: 2026-10-11
- Deciders: the Embedded Academy maintainer

## Context and problem statement

Contributors need docs about the project itself: how to build it, how to write a lesson, what the conventions are and why. These docs have a different audience from the courses and change with the code.

Which tool, structure and host should the project docs use?

## Decision drivers

- Docs are written in Markdown, like the lessons.
- Each page has one clear purpose, so readers find what they need.
- The build fails on broken references, not silently.
- Docs are published without running our own server.

## Considered options

- Sphinx with MyST Markdown, organised by Diátaxis, on Read the Docs
- A docs section inside the Astro site
- The GitHub wiki

## Decision outcome

Chosen option: **Sphinx** with **MyST Markdown** and the Furo theme, in `docs/`, organised by [Diátaxis](https://diataxis.fr/) into `tutorials/`, `how-to/`, `reference/` and `explanation/`, and published on **Read the Docs**.

The build runs with warnings as errors. Docs change in the same pull request as the code or process they describe.

### Consequences

- Good: Diátaxis gives every page one type, the same rule lessons follow.
- Good: Sphinx checks cross-references, and Read the Docs can build a preview for each pull request.
- Bad: the repository needs a Python toolchain next to Node.js. uv keeps it to one command.
