// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { enter } from './motion.ts';
import {
  clampStep,
  type RelayView,
  relayState,
  relayStatus,
  renderRelayConsole,
  renderRelayDetail,
  renderRelayStages,
} from './relay.ts';

/** Keys that move between stages while focus is on the stage list. */
export function relayKeyTarget(key: string, index: number, count: number): number | undefined {
  if (key === 'ArrowRight' || key === 'ArrowDown') return Math.min(count - 1, index + 1);
  if (key === 'ArrowLeft' || key === 'ArrowUp') return Math.max(0, index - 1);
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return undefined;
}

/**
 * <ea-handoff-relay>: steps through the boot chain, showing each stage's
 * console lines, what it loaded and what it hands to the next stage. The
 * server renders the first stage.
 */
export class EaHandoffRelay extends HTMLElement {
  #view: RelayView | undefined;
  #index = 0;

  get index(): number {
    return this.#index;
  }

  #part(name: string): HTMLElement | null {
    return this.querySelector<HTMLElement>(`[data-part="${name}"]`);
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
    const json = this.querySelector('script[data-relay]')?.textContent;
    if (!json || !this.#part('stages')) return false;
    this.#view = JSON.parse(json) as RelayView;
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKey);
    this.toggleAttribute('data-ready', true);
    return true;
  }

  disconnectedCallback(): void {
    this.removeAttribute('data-ready');
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKey);
  }

  /** Shows step `index`. `focus` moves focus to its stage button. */
  select(index: number, focus = false): void {
    const view = this.#view;
    if (!view) return;
    const next = clampStep(view, index);
    const forward = next > this.#index;
    this.#index = next;
    const stages = this.#part('stages');
    if (stages) stages.innerHTML = renderRelayStages(relayState(view, next));
    const detail = this.#part('detail');
    if (detail) detail.innerHTML = renderRelayDetail(view, next);
    const out = this.#part('console');
    if (out) {
      out.innerHTML = renderRelayConsole(view, next);
      out.scrollTop = out.scrollHeight;
    }
    const status = this.#part('status');
    if (status) status.textContent = relayStatus(view, next);
    if (focus) stages?.querySelector<HTMLElement>(`[data-step="${next}"]`)?.focus();
    if (forward) {
      const group = out?.querySelector('.ea-relay__group.is-current');
      if (group) enter(group, { y: 8 });
      enter([...(detail?.querySelectorAll('[data-part="handoff"], .ea-relay__load.is-new') ?? [])], { x: -16 });
    }
  }

  #onClick = (event: Event): void => {
    const target = event.target as Element;
    const stage = target.closest<HTMLElement>('[data-step]');
    const part = target.closest<HTMLElement>('[data-part]')?.dataset.part;
    if (stage) this.select(Number(stage.dataset.step));
    else if (part === 'next') this.select(this.#index + 1);
    else if (part === 'prev') this.select(this.#index - 1);
  };

  #onKey = (event: KeyboardEvent): void => {
    const view = this.#view;
    if (!view || !(event.target as Element).closest('[data-step]')) return;
    const to = relayKeyTarget(event.key, this.#index, view.steps.length);
    if (to === undefined) return;
    event.preventDefault();
    this.select(to, true);
  };
}

export function defineHandoffRelay(): void {
  if (!customElements.get('ea-handoff-relay')) customElements.define('ea-handoff-relay', EaHandoffRelay);
}
