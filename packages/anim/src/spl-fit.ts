// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import type { SplFitFigure } from '@ea/boards';
import { animate } from 'animejs';
import {
  addBytes,
  type FitState,
  fitStart,
  renderBudget,
  renderFitControls,
  renderFitResult,
  renderZoom,
  splFits,
  undoFit,
} from './fit.ts';
import { DURATION, prefersReducedMotion } from './motion.ts';
import { moveFocus } from './toolbar.ts';

/**
 * <ea-spl-fit>: the learner adds bytes to the BeagleBone Black SPL until the
 * link would fail. The server renders the SPL as the lab measured it.
 */
export class EaSplFit extends HTMLElement {
  #fig: SplFitFigure | undefined;
  #state: FitState = fitStart();

  get state(): FitState {
    return this.#state;
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
    const json = this.querySelector('script[data-fit]')?.textContent;
    if (!json || !this.#part('controls')) return false;
    this.#fig = JSON.parse(json) as SplFitFigure;
    this.#state = fitStart();
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeydown);
    this.toggleAttribute('data-ready', true);
    return true;
  }

  disconnectedCallback(): void {
    this.removeAttribute('data-ready');
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeydown);
  }

  /** Adds bytes to SPL. Once the link fails, it says so instead. */
  add(bytes: number): void {
    const fig = this.#fig;
    if (!fig) return;
    if (!splFits(fig, this.#state)) {
      this.#say('The link already fails. Undo or reset before you add more.');
      return;
    }
    this.#show(addBytes(fig, this.#state, bytes), `[data-add="${bytes}"]`);
  }

  undo(): void {
    if (this.#state.added.length === 0) {
      this.#say('Nothing to undo: SPL is as the lab built it.');
      return;
    }
    this.#show(undoFit(this.#state), '[data-part="undo"]');
  }

  reset(): void {
    this.#show(fitStart(), '[data-part="reset"]');
  }

  #say(text: string): void {
    const note = this.#part('note');
    if (note) note.textContent = text;
  }

  /** Shows `state`; `focus` names the control to keep focused, as a selector. */
  #show(state: FitState, focus?: string): void {
    const fig = this.#fig;
    if (!fig) return;
    const before = new Map(
      [...this.querySelectorAll<HTMLElement>('[data-fill]')].map((el) => [el.dataset.fill, el.style.width]),
    );
    this.#state = state;
    const parts: [string, string][] = [
      ['budget', renderBudget(fig, state)],
      ['zoom', renderZoom(fig, state)],
      ['result', renderFitResult(fig, state)],
      ['controls', renderFitControls(fig, state)],
    ];
    for (const [name, html] of parts) {
      const el = this.#part(name);
      if (el) el.innerHTML = html;
    }
    this.#say('');
    // Re-rendering the controls drops focus: put it back on the same control.
    if (focus) this.querySelector<HTMLElement>(focus)?.focus();
    if (prefersReducedMotion()) return;
    for (const el of this.querySelectorAll<HTMLElement>('[data-fill]')) {
      const from = before.get(el.dataset.fill);
      if (from && from !== el.style.width) {
        animate(el, { width: [from, el.style.width], duration: DURATION.state, ease: 'outQuad' });
      }
    }
  }

  #onClick = (event: Event): void => {
    const target = event.target as Element;
    const add = target.closest<HTMLElement>('[data-add]')?.dataset.add;
    const part = target.closest<HTMLElement>('[data-part]')?.dataset.part;
    if (add) this.add(Number(add));
    else if (part === 'undo') this.undo();
    else if (part === 'reset') this.reset();
  };

  #onKeydown = (event: KeyboardEvent): void => {
    const controls = this.#part('controls');
    if (controls?.contains(event.target as Node)) moveFocus(event, controls);
  };
}

export function defineSplFit(): void {
  if (!customElements.get('ea-spl-fit')) customElements.define('ea-spl-fit', EaSplFit);
}
