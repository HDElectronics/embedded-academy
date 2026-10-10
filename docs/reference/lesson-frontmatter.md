<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Lesson frontmatter

Every lesson `.mdx` file starts with YAML frontmatter. The site validates it with a schema at build time; a lesson that doesn't match fails the build.

## Fields

`title`
: Required. String. The page title. Sentence case that states the point.

`description`
: Required. String of at most 160 characters. Used in search results and link previews.

`course`
: Required. String. The course slug, for example `linux-boot-arm`.

`module`
: Required. One of `m00`, `m01`, ... `m10`.

`order`
: Required. Integer. The lesson's position inside its module.

`type`
: Required. One of `tutorial`, `how-to`, `reference`, `explanation`. The page's single Diátaxis type.

`boards`
: Required. Array of `rpi4`, `bbb`, `stm32mp157`. The boards the page covers. May be empty for a board-independent page.

`verification`
: Required. One of `unverified`, `emulated`, `hardware`. See [Verification levels](#verification-levels).

`sources`
: Array of source objects. See [Sources](#sources). Required and non-empty for every page that states hardware facts.

`draft`
: Optional. Boolean, default `false`. A draft merges to `main` but stays out of production builds.

## Board identifiers

| Value        | Board            |
| ------------ | ---------------- |
| `rpi4`       | Raspberry Pi 4   |
| `bbb`        | BeagleBone Black |
| `stm32mp157` | STM32MP157 DK2   |

Raspberry Pi 5 differences appear on a side page of the Raspberry Pi 4 material; Pi 5 has no identifier of its own.

## Verification levels

`unverified`
: Nobody has run it yet. This is the default for new work.

`emulated`
: Run in the lab container under QEMU. Claim it only if you ran it in the change that sets it.

`hardware`
: Run on the board by a person. Only a person with the board can set it.

## Sources

Each entry in `sources` is an object:

`title`
: Required. String. The document's title as its publisher gives it.

`url`
: Optional. String. A stable link to the document.

`section`
: Optional. String. The chapter, section or table you used.

The schema requires a non-empty `sources` list on every page, with one exception: a `tutorial` page that makes no factual claims may leave it empty. Every page that states hardware facts lists its sources.

## Example

```yaml
title: U-Boot relocates itself
description: Why U-Boot copies itself to a new place in RAM and what changes afterwards.
course: linux-boot-arm
module: m05
order: 3
type: explanation
boards: [rpi4, bbb, stm32mp157]
verification: unverified
sources:
  - title: U-Boot documentation
    url: https://docs.u-boot.org/en/latest/
draft: true
```

The example shows the shape of the frontmatter. Its values are placeholders.
