// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { enter } from './motion.ts';
import {
  advance,
  advanceLabel,
  choiceKeyTarget,
  PREDICT_START,
  type PredictState,
  type PredictView,
  pickChoice,
  renderPredictChoices,
  renderPredictConsole,
  renderPredictMeta,
  renderPredictResult,
} from './predict.ts';

/**
 * <ea-predict-line>: shows the console up to a point and asks which real line
 * comes next. Keeps a score and explains each answer. The server renders the
 * first question.
 */
export class EaPredictLine extends HTMLElement {
  #view: PredictView | undefined;
  #state: PredictState = PREDICT_START;

  get state(): PredictState {
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
    const json = this.querySelector('script[data-predict]')?.textContent;
    if (!json || !this.#part('choices')) return false;
    this.#view = JSON.parse(json) as PredictView;
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

  /** Picks choice `i` on the current question. */
  pick(i: number): void {
    const view = this.#view;
    if (!view) return;
    const next = pickChoice(view, this.#state, i);
    if (next === this.#state) return;
    this.#render(next, i);
    const line = this.querySelector('.ea-predict__next');
    if (line) enter(line, { x: -16 });
  }

  /** Next question, skip, see the score, or start again. */
  advance(): void {
    const view = this.#view;
    if (!view) return;
    const next = advance(view, this.#state);
    const newQuestion = !next.done;
    this.#render(next, 0, newQuestion);
    if (newQuestion) enter([this.#part('console'), this.#part('choices')].filter((e): e is HTMLElement => !!e));
  }

  #render(next: PredictState, focus: number, focusChoice = true): void {
    const view = this.#view;
    if (!view) return;
    const hadFocus = this.contains(document.activeElement);
    this.#state = next;
    const consoleOut = this.#part('console');
    if (consoleOut) {
      consoleOut.innerHTML = renderPredictConsole(view, next);
      consoleOut.hidden = next.done;
    }
    const choices = this.#part('choices');
    if (choices) {
      choices.innerHTML = renderPredictChoices(view, next, focus);
      choices.hidden = next.done;
    }
    const result = this.#part('result');
    if (result) result.innerHTML = renderPredictResult(view, next);
    const meta = this.#part('meta');
    if (meta) meta.textContent = renderPredictMeta(view, next);
    const button = this.#part('advance');
    if (button) button.textContent = advanceLabel(view, next);
    if (hadFocus && focusChoice && !next.done) choices?.querySelector<HTMLElement>(`[data-choice="${focus}"]`)?.focus();
  }

  #onClick = (event: Event): void => {
    const target = event.target as Element;
    const choice = target.closest<HTMLElement>('[data-choice]');
    if (choice) this.pick(Number(choice.dataset.choice));
    else if (target.closest('[data-part="advance"]')) this.advance();
  };

  #onKey = (event: KeyboardEvent): void => {
    const choice = (event.target as Element).closest<HTMLElement>('[data-choice]');
    const all = [...this.querySelectorAll<HTMLElement>('[data-choice]')];
    if (!choice || all.length === 0) return;
    const to = choiceKeyTarget(event.key, Number(choice.dataset.choice), all.length);
    if (to === undefined) return;
    event.preventDefault();
    for (const [k, el] of all.entries()) el.tabIndex = k === to ? 0 : -1;
    all[to]?.focus();
  };
}

export function definePredictLine(): void {
  if (!customElements.get('ea-predict-line')) customElements.define('ea-predict-line', EaPredictLine);
}
