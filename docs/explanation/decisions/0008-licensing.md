<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# 0008 License code MIT and content CC-BY-SA-4.0

- Status: accepted
- Date: 2026-10-11
- Deciders: the Embedded Academy maintainer

## Context and problem statement

The repository holds two kinds of work: code (the site, components, board data, lab scripts) and content (lessons, docs, diagrams, captured logs). It also quotes code from upstream projects under their own licenses. Each file must carry the right terms, and tools must be able to check them.

How should the project license its files?

## Decision drivers

- Code is easy to reuse in other projects.
- Content stays open when others adapt it.
- Upstream excerpts keep the license their authors chose.
- A machine can check every file's license.

## Considered options

- MIT for code, CC-BY-SA-4.0 for content, following REUSE
- One license for everything
- CC-BY-4.0 for content

## Decision outcome

Chosen option:

- **MIT** for code: site, components, board data and lab scripts.
- **CC-BY-SA-4.0** for content: lessons, docs, diagrams and captured logs.
- **REUSE** compliance: every file carries SPDX tags, or is covered in `REUSE.toml` if it can't hold comments. License texts live in `LICENSES/`.
- Upstream excerpts keep their original license and copyright line, such as `GPL-2.0-only` for kernel and U-Boot code.

### Consequences

- Good: `reuse lint` checks every file automatically.
- Good: adaptations of the lessons stay under a share-alike license.
- Bad: every new file needs a header, and reviewers must check the license of every quoted excerpt.
- Bad: text from a source whose license is unknown can't be used at all.
