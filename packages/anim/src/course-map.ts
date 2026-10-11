// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { animate } from 'animejs';
import { DURATION, prefersReducedMotion } from './motion.ts';

/**
 * <ea-course-map>: the course drawn as a line from reset to PID 1. The server
 * renders every module's detail panel, hidden except the selected one; this
 * element switches panels and moves the marker to the selected stop.
 */
export class EaCourseMap extends HTMLElement {
  #selected = '';

  get selected(): string {
    return this.#selected;
  }

  connectedCallback(): void {
    // Children may not be parsed yet when the element connects: retry once they are.
    if (!this.#init())
      queueMicrotask(
        () => this.#init() || document.addEventListener('DOMContentLoaded', () => this.#init(), { once: true }),
      );
  }

  #init(): boolean {
    if (this.hasAttribute('data-ready')) return true;
    const pressed = this.querySelector<HTMLElement>('[data-module][aria-pressed="true"]');
    if (!pressed?.dataset.module) return false;
    this.#selected = pressed.dataset.module;
    this.addEventListener('click', this.#onClick);
    addEventListener('resize', this.#onResize);
    this.#moveMarker(false);
    this.toggleAttribute('data-ready', true);
    return true;
  }

  disconnectedCallback(): void {
    this.removeAttribute('data-ready');
    this.removeEventListener('click', this.#onClick);
    removeEventListener('resize', this.#onResize);
  }

  select(id: string): void {
    const button = this.querySelector<HTMLElement>(`[data-module="${CSS.escape(id)}"]`);
    if (!button) return;
    this.#selected = id;
    for (const b of this.querySelectorAll<HTMLElement>('[data-module]')) {
      b.setAttribute('aria-pressed', String(b.dataset.module === id));
    }
    for (const panel of this.querySelectorAll<HTMLElement>('[data-panel]')) {
      panel.hidden = panel.dataset.panel !== id;
    }
    this.#moveMarker(true);
  }

  /** Puts the marker on the selected stop, or hides it when the module is not on the line. */
  #moveMarker(travel: boolean): void {
    const marker = this.querySelector<HTMLElement>('[data-part="marker"]');
    const line = this.querySelector<HTMLElement>('[data-part="line"]');
    if (!marker || !line) return;
    const node = line.querySelector<HTMLElement>(`[data-node="${CSS.escape(this.#selected)}"]`);
    marker.hidden = !node;
    if (!node) return;
    const box = line.getBoundingClientRect();
    const at = node.getBoundingClientRect();
    const x = at.left - box.left + at.width / 2 - marker.offsetWidth / 2;
    const y = at.top - box.top + at.height / 2 - marker.offsetHeight / 2;
    if (!travel || prefersReducedMotion()) {
      marker.style.transform = `translate(${x}px, ${y}px)`;
      return;
    }
    animate(marker, { translateX: x, translateY: y, duration: DURATION.travel, ease: 'inOutQuad' });
  }

  #onClick = (event: Event): void => {
    const button = (event.target as Element).closest<HTMLElement>('[data-module]');
    if (button?.dataset.module && this.contains(button)) this.select(button.dataset.module);
  };

  #onResize = (): void => this.#moveMarker(false);
}

export function defineCourseMap(): void {
  if (!customElements.get('ea-course-map')) customElements.define('ea-course-map', EaCourseMap);
}
