<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Add an animation component

This guide adds a new animation component, in the family of `BootChain`, `MemoryMap` and `PrivilegeLadder`, to `packages/anim`.

## Start from an issue

Find or open an issue with the `animation` issue form and move it to **In progress**. Work on a branch such as `feat/anim-<name>`.

## Plan the steps before the motion

Write down the steps the animation walks through and what each one shows at rest. Every step must read correctly when paused. Never put information only in a frame between steps.

## Drive the component from board data

Read every address, stage, file name and size from `packages/boards`. Never hard-code them in the component. If the data you need is missing, add it to the board data with a `source` first. [Add a board](add-a-board.md) gives the rules for board data.

## Build the animation with anime.js v4

1. Create the component in `packages/anim`. Start the file with SPDX tags and the `MIT` license.
2. Use anime.js v4. Don't add another animation library.
3. Use these durations: 150 ms for state changes, 300 ms for a stage transition, 600 ms for travel across a diagram. Ease out on entry; ease in-out on travel.
4. Replay console text at about 30 characters per second.

## Give the learner control

- Provide a stepped mode with Play, Pause, Previous and Next.
- Make every control work from the keyboard, with the 2px focus ring.
- Write buttons as bracketed text, such as `[ Play boot ]`, with one primary button per pane.

## Show captured output, never typed output

A figure that shows console lines reads them from a capture in `logs/qemu/`. Describe each span as a `CaptureRef`, `{ log: 'qemu/m10-chain-virt.log', from: 55, to: 61 }`: the file under `logs/` and an inclusive range of its raw line numbers, as your editor shows them. Put the refs in the figure's data module under `packages/boards/src/`, and read them at build time in the `.astro` component with `captureSpan(ref)` from `@ea/boards/node`. A span that reaches into the `#` header, or past the end of the file, fails the build.

Any address, size or number the figure states outside the console lines must also come from a capture or from board data. Test it: assert that `captureSpan(ref).join('
')` contains the value, so a re-captured log that changes the number fails the test instead of the lesson.

## Mark it as a figure

Give the component's root element a `data-figure` attribute with a short lowercase name, such as `data-figure="memory-map"`. Lessons keep prose at 72 characters wide and let elements with `data-figure` use the full content width, so the figure stays readable next to the text that introduces it.

## Respect reduced motion

When the user sets `prefers-reduced-motion`, switch stages instantly, stop the cursor blinking and turn Play into Next.

## Use design tokens only

Use colours only through tokens from `packages/ui`, such as `--accent` or `--world-secure`. Pair every colour with a word or a marker, because colour never carries meaning alone. Use borders, not shadows, and no CRT effects.

## Test end states and step boundaries

Write Vitest and Testing Library tests with timers mocked. Check the state at each step boundary and at the end. Don't test intermediate frames.

## Check and open the pull request

1. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm e2e`.
2. Take screenshots in the dark and light themes, at desktop and phone width.
3. Open a pull request titled `feat(anim): ...` and attach the screenshots.
