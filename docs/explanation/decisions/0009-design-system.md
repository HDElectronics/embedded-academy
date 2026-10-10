<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# 0009 Make the site look like a Linux terminal

- Status: accepted
- Date: 2026-10-11
- Deciders: the Embedded Academy maintainer

## Context and problem statement

The learners work in terminals, serial consoles and boot logs. The site's look can either feel like the tools they will use or like a generic course platform. Whatever the look, it must stay readable and accessible in a light and a dark theme.

Which visual language should the site use?

## Decision drivers

- The site feels familiar to someone who works in a Linux shell.
- Text meets 4.5:1 contrast, and control borders and focus rings 3:1, in both themes.
- Terminal elements appear only where they mean what they say.
- The look doesn't get in the way of reading.

## Considered options

- A terminal look built on the Tango palette and Ubuntu fonts
- A generic course platform look with cards and shadows
- A retro terminal look with CRT effects

## Decision outcome

Chosen option: a terminal look.

- Layout from tmux-like panes, with borders, not shadows.
- The **Tango** palette, used only through tokens. World colours are fixed: `world-secure` yellow, `world-normal` cyan, `world-firmware` magenta.
- **Ubuntu Sans Mono** for headings, UI and code; **Ubuntu Sans** for lesson prose.
- **VT323** only for boot banners in hero animations.
- **TTY** (dark) is the default theme; **Paper** (light) works equally well.
- **No CRT effects**: no scanlines, glow or flicker.

### Consequences

- Good: the site feels like the environment the lessons teach.
- Good: tokens keep both themes consistent and checkable.
- Bad: terminal vocabulary, such as `[  OK  ]`, must only mark real states, which reviewers have to check.
- Bad: colour can't carry meaning alone, so every coloured state also needs a word or a marker.
