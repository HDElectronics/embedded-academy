// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { ladderState, renderLadder } from './ladder.ts';
import { clampIndex } from './model.ts';
import { positions, prefersReducedMotion, travelFrom } from './motion.ts';
import type { ChainBoard } from './types.ts';

/** Time each stage stays on screen while playing. */
const STEP_MS = 1600;

/**
 * <ea-privilege-ladder>: moves a marker across exception levels and security
 * states as a board boots. The server renders the first stage.
 */
export class EaPrivilegeLadder extends HTMLElement {
  #board: ChainBoard | undefined;
  #index = 0;
  #timer: ReturnType<typeof setInterval> | undefined;

  get index(): number {
    return this.#index;
  }

  get playing(): boolean {
    return this.#timer !== undefined;
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
    const json = this.querySelector('script[data-ladder]')?.textContent;
    if (!json) return false;
    this.#board = JSON.parse(json) as ChainBoard;
    this.addEventListener('click', this.#onClick);
    this.#updatePlay();
    this.toggleAttribute('data-ready', true);
    return true;
  }

  disconnectedCallback(): void {
    this.stop();
    this.removeAttribute('data-ready');
    this.removeEventListener('click', this.#onClick);
  }

  select(index: number): void {
    const board = this.#board;
    const body = this.querySelector<HTMLElement>('[data-part="ladder"]');
    if (!board || !body) return;
    const next = clampIndex(board, index);
    const forward = next > this.#index;
    this.#index = next;
    const before = forward ? positions(body, 'data-token') : new Map<string, DOMRect>();
    body.innerHTML = renderLadder(board, ladderState(board, next));
    if (forward) travelFrom(body, 'data-token', before);
    const status = this.querySelector('[data-part="status"]');
    if (status) status.textContent = `Stage ${next + 1} of ${board.stages.length}: ${board.stages[next]?.name}`;
  }

  play(): void {
    const board = this.#board;
    if (!board) return;
    if (prefersReducedMotion()) {
      this.select(this.#index + 1);
      return;
    }
    if (this.playing) {
      this.stop();
      return;
    }
    if (this.#index >= board.stages.length - 1) this.select(0);
    this.#timer = setInterval(() => {
      if (this.#index >= board.stages.length - 1) this.stop();
      else this.select(this.#index + 1);
    }, STEP_MS);
    this.#updatePlay();
  }

  stop(): void {
    clearInterval(this.#timer);
    this.#timer = undefined;
    this.#updatePlay();
  }

  #updatePlay(): void {
    const button = this.querySelector<HTMLButtonElement>('[data-part="play"]');
    if (!button) return;
    button.textContent = prefersReducedMotion() ? 'Next stage' : this.playing ? 'Pause' : 'Play boot';
    button.setAttribute('aria-pressed', String(this.playing));
  }

  #onClick = (event: Event): void => {
    const part = (event.target as Element).closest<HTMLElement>('[data-part]')?.dataset.part;
    if (part === 'play') this.play();
    else if (part === 'next') {
      this.stop();
      this.select(this.#index + 1);
    } else if (part === 'prev') {
      this.stop();
      this.select(this.#index - 1);
    }
  };
}

export function definePrivilegeLadder(): void {
  if (!customElements.get('ea-privilege-ladder')) customElements.define('ea-privilege-ladder', EaPrivilegeLadder);
}
