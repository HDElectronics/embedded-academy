// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// Keyboard movement inside a group of buttons: every button stays in the Tab
// order, and the arrow keys, Home and End move between them as well.

const KEYS = new Set(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']);

/** Index of the button focus moves to, or -1 when `key` does not move it. */
export function nextButton(key: string, current: number, count: number): number {
  if (!KEYS.has(key) || count === 0) return -1;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  const step = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;
  return (current + step + count) % count;
}

/**
 * Moves focus between the buttons of `group` for an arrow, Home or End key.
 * Returns true, after preventing the default scroll, when it handled the key.
 */
export function moveFocus(event: KeyboardEvent, group: Element): boolean {
  const buttons = [...group.querySelectorAll<HTMLButtonElement>('button')];
  const current = buttons.indexOf(event.target as HTMLButtonElement);
  if (current < 0) return false;
  const next = nextButton(event.key, current, buttons.length);
  if (next < 0) return false;
  event.preventDefault();
  buttons[next]?.focus();
  return true;
}
