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

## Make it work as a session window

Give the component's root element a `data-window` attribute with a short lowercase name, such as `data-window="memory-map"`. On wide screens the lesson layout moves every element with `data-window` out of the text into a window with that name, and moves the first `data-window="serial"` into the serial pane. The component must survive the move: custom elements are disconnected and connected again, so set up and tear down listeners in `connectedCallback` and `disconnectedCallback`, and render from the server markup.

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
