<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Commit conventions

Commits and pull request titles follow [Conventional Commits](https://www.conventionalcommits.org/). Pull requests are squash-merged, so the pull request title becomes the commit on `main`.

## Format

```text
<type>(<scope>): <subject>

<body>

<footer>
```

## Types

| Type       | Use it for                                             | Release effect |
| ---------- | ------------------------------------------------------ | -------------- |
| `feat`     | A new feature of the site, components or labs          | minor          |
| `content`  | Lesson text, labs and captured logs                    | patch          |
| `fix`      | A bug fix, including a wrong technical fact            | patch          |
| `docs`     | Repository docs in `docs/` and root files, not lessons | none           |
| `refactor` | A code change that keeps behaviour                     | none           |
| `test`     | Tests only                                             | none           |
| `build`    | Build system and dependencies                          | none           |
| `ci`       | CI workflows                                           | none           |
| `chore`    | Anything else that doesn't touch shipped output        | none           |

A `BREAKING CHANGE:` footer bumps the major version, whatever the type. A changed lesson URL is a breaking change.

## Scopes

`site`, `anim`, `ui`, `boards`, `labs`, `deps`, `docs`, or a module from `m00` to `m10`.

## Subject

- Imperative mood: "add", not "added" or "adds".
- Lowercase, no final period.
- At most 72 characters, including type and scope.

## Body

Say why the change is needed. The diff already shows what changed.

## Footer

- `Refs #N` or `Closes #N` to link the issue.
- `BREAKING CHANGE: <what breaks>` for breaking changes.
- `Signed-off-by: Name <email>`, added by `git commit -s`. See [Sign-off](#sign-off).

## Examples

```text
feat(anim): add MemoryMap relocation timeline
content(m03): explain TZC-400 regions on STM32MP1
docs(docs): add the lesson frontmatter reference
```

## Branch names

Name a branch `<type>/<scope>-<what>`: lowercase, hyphens, at most 50 characters. An issue number is optional.

```text
feat/anim-memory-map
content/m04-ddr-training
fix/42-boards-stm32-sysram
```

Branches are short-lived: one per issue, merged within 3 days.

## Sign-off

Every commit carries a `Signed-off-by` line, added by `git commit -s`. It certifies the [Developer Certificate of Origin](https://developercertificate.org/). Never add a sign-off for a person who didn't write the change.
