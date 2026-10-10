// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { animate, stagger } from 'animejs';

/** Durations from the design system, in milliseconds. */
export const DURATION = { state: 150, stage: 300, travel: 600 } as const;

/** Console replay speed: about 30 characters per second, faster for long chunks. */
export const TYPE_CPS = 30;
export const TYPE_MAX_MS = 1800;

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Fades and slides elements in. Does nothing when motion is reduced. */
export function enter(targets: Element | Element[], from: { x?: number; y?: number } = {}): void {
  if (prefersReducedMotion()) return;
  const list = Array.isArray(targets) ? targets : [targets];
  if (list.length === 0) return;
  animate(list, {
    opacity: [0, 1],
    translateX: [from.x ?? 0, 0],
    translateY: [from.y ?? 0, 0],
    duration: DURATION.stage,
    delay: list.length > 1 ? stagger(40) : 0,
    ease: 'outQuad',
  });
}

/**
 * Typing cadence for `total` characters: TYPE_CPS, sped up so the chunk
 * finishes within TYPE_MAX_MS. Ticks never run faster than every 16 ms.
 */
export function typingCadence(total: number): { chars: number; interval: number } {
  const cps = Math.max(TYPE_CPS, total / (TYPE_MAX_MS / 1000));
  const msPerChar = 1000 / cps;
  if (msPerChar >= 16) return { chars: 1, interval: Math.round(msPerChar) };
  return { chars: Math.ceil(16 / msPerChar), interval: 16 };
}
