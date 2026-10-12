// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import type { ElOp, ExceptionLevelsFigure } from '@ea/boards';
import {
  type ElevatorState,
  moves,
  renderOps,
  renderPending,
  renderPosition,
  renderResult,
  run,
  startState,
} from './elevator.ts';
import { enter, positions, travelFrom } from './motion.ts';
import { moveFocus } from './toolbar.ts';

/**
 * <ea-exception-levels>: the learner runs svc, hvc, smc and eret and watches
 * the core move between exception levels. The server renders the start state.
 */
export class EaExceptionLevels extends HTMLElement {
  #fig: ExceptionLevelsFigure | undefined;
  #state: ElevatorState = { at: 'EL0', pending: [] };

  get state(): ElevatorState {
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
    const json = this.querySelector('script[data-elevator]')?.textContent;
    if (!json || !this.#part('ops')) return false;
    this.#fig = JSON.parse(json) as ExceptionLevelsFigure;
    this.#state = startState(this.#fig);
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

  /** Runs one instruction at the current level and shows what happened. */
  press(op: ElOp): void {
    const fig = this.#fig;
    if (!fig) return;
    const before = this.#position();
    const { state, outcome } = run(fig, this.#state, op);
    this.#state = state;
    this.#render(before);
    const result = this.#part('result');
    if (result) {
      result.innerHTML = renderResult(fig, outcome);
      enter(result);
    }
    // Re-rendering the instruction list drops focus: put it back on the same instruction.
    this.querySelector<HTMLElement>(`[data-op="${op}"]`)?.focus();
  }

  /** Back to the start level with no pending returns. */
  reset(): void {
    const fig = this.#fig;
    if (!fig) return;
    const before = this.#position();
    this.#state = startState(fig);
    this.#render(before);
    const result = this.#part('result');
    if (result) result.innerHTML = renderResult(fig);
  }

  /** True when the instruction would move the core from where it is now. */
  canMove(op: ElOp): boolean {
    return this.#fig ? moves(this.#fig, this.#state, op) : false;
  }

  #position(): Map<string, DOMRect> {
    const ladder = this.#part('position');
    return ladder ? positions(ladder, 'data-token') : new Map();
  }

  #render(before: Map<string, DOMRect>): void {
    const fig = this.#fig;
    if (!fig) return;
    const ladder = this.#part('position');
    if (ladder) {
      ladder.innerHTML = renderPosition(fig, this.#state);
      travelFrom(ladder, 'data-token', before);
    }
    const ops = this.#part('ops');
    if (ops) ops.innerHTML = renderOps(fig, this.#state);
    const pending = this.#part('pending');
    if (pending) pending.innerHTML = renderPending(this.#state);
  }

  #onClick = (event: Event): void => {
    const target = event.target as Element;
    const op = target.closest<HTMLElement>('[data-op]')?.dataset.op;
    if (op) this.press(op as ElOp);
    else if (target.closest('[data-part="reset"]')) this.reset();
  };

  #onKeydown = (event: KeyboardEvent): void => {
    const ops = this.#part('ops');
    if (ops?.contains(event.target as Node)) moveFocus(event, ops);
  };
}

export function defineExceptionLevels(): void {
  if (!customElements.get('ea-exception-levels')) customElements.define('ea-exception-levels', EaExceptionLevels);
}
