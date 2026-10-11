<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Course file

Each course has a `course.yaml` in `content/courses/<slug>/`. The site validates it at build time.

## Fields

`title`
: Required. String. The course title.

`description`
: Required. String, at most 160 characters.

`boards`
: Required. List of board identifiers the course covers.

`modules`
: Required. List of modules in teaching order, with the fields below.

## Module fields

`id`
: Required. `m00` to `m10`.

`title`, `summary`
: Required. Strings shown on the course page.

`chain`
: Optional. Places the module on the course map's boot path, from reset to PID 1. `chain.short` is the label on the map, at most 16 characters. `chain.world` is `firmware`, `secure`, `normal` or `mixed`: it sets the colour of the line at that stop and the word under it. Use `mixed` when the stage runs in different worlds on different boards.

Modules without `chain` appear beside the line: those listed before the first stop under "Before power-on", the rest under "Then".

## Example

```yaml
modules:
  - id: m06
    title: U-Boot
    summary: The bootloader you will spend the most time in.
    chain: { short: U-Boot, world: normal }
```
