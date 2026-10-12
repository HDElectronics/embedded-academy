<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Lesson components

Lessons are MDX. Import these components at the top of the file, after the frontmatter. Write prose in Markdown and use a component only where the house style asks for one.

## Content components

From `@ea/ui`:

`Prompt`
: One shell command. Props: `cmd` (the command, exactly as typed), `dir` (working directory, default `~`), `user` (`learner` or `root`, default `learner`), `host` (default `lab`, the lab container). One command per Prompt. Command output never goes here: replay it from `logs/` with `SerialConsole`.

`CodeBlock`
: A file, or part of one, from an upstream project. Wrap a fenced code block. Props: `path` (the real path in its project), `project` (such as `U-Boot`), `lang`, `simplified` (set when lines were cut), `href` (the file upstream at the pinned version).

`Callout`
: An aside. Prop: `level`, one of `info` (`<6> info`), `warning` (`<4> warning`) or `error` (`<3> error`).

`Deeper`
: A collapsed panel for readers who want more. Props: `depth` (`practitioner` or `expert`) and `title`. The base path must read complete without it.

## Lead paragraph

Open a lesson with one lead paragraph in a `div`, not a `p`:

```html
<div class="t-lead">
  The first paragraph, on its own lines.
</div>
```

MDX turns text on its own lines into a paragraph. Inside a `<p>` that would make a paragraph inside a paragraph, which is invalid HTML: the browser drops the lead style. The site's remark plugin `apps/site/src/lib/remark-unwrap-paragraphs.mjs` unwraps that inner paragraph in `p`, `span`, headings, `figcaption` and `summary`, so a `<p class="t-lead">` still renders correctly. Prefer the `div` all the same: it reads the same everywhere and does not depend on the plugin.

## Figures

From `@ea/anim`. Each figure reads its facts from `packages/boards` and its console lines from `logs/`; never hard-code them in a lesson.

`BootChain`
: The boot chain, stage by stage. Props: `boards` (default all), `label`, `pane`.

`MemoryMap`
: Memory regions and the images loaded into them. Props: `board`, `upTo` (stage index), `pane`.

`PrivilegeLadder`
: Exception or privilege levels by security state. Props: `board`, `pane`.

`SerialConsole`
: A log replay with a stage timeline. Props: `board`, `pane`.

Figures sit in the text, at the full content width. Refer to a figure by name, never as "below" or "above".

## Example

```jsx
import Prompt from '@ea/ui/Prompt.astro';
import Callout from '@ea/ui/Callout.astro';

<Prompt dir="~/src/u-boot" cmd="make am335x_evm_defconfig" />

<Callout level="warning">
  Build U-Boot for the board you have.
</Callout>
```

The example shows the syntax. Its command is a placeholder: check every command against the pinned upstream version before you use it in a lesson.
