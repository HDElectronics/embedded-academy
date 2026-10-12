// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { positions, prefersReducedMotion, travelFrom } from './motion.ts';
import {
  choiceKey,
  clampChoice,
  type ReplayData,
  renderChoices,
  renderOutcome,
  renderReplayConsole,
  replayStatus,
} from './replay.ts';
import { ConsoleTyper } from './typer.ts';

/** Renders the figure's own picture for one choice, such as a memory strip. */
export type SceneRenderer<T extends ReplayData> = (data: T, index: number) => string;

/**
 * Base for "pick a scenario, replay its capture" figures. The server renders
 * the first choice complete; this element makes the radio group work, types
 * the chosen run's console lines again, and moves anything in the scene that
 * carries `data-token` from its old place to its new one.
 *
 * Parts: `choices` (the radio group), `scene`, `console`, `where`, `outcome`,
 * `status` (polite live region) and `play` (the one primary button).
 */
export class ReplayFigure<T extends ReplayData = ReplayData> extends HTMLElement {
  protected scene: SceneRenderer<T> | undefined;
  #data: T | undefined;
  #index = 0;
  #typer: ConsoleTyper | undefined;

  get index(): number {
    return this.#index;
  }

  #part<E extends HTMLElement = HTMLElement>(name: string): E | null {
    return this.querySelector<E>(`[data-part="${name}"]`);
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
    const json = this.querySelector('script[data-replay]')?.textContent;
    const out = this.#part('console');
    if (!json || !out) return false;
    this.#data = JSON.parse(json) as T;
    this.#typer = new ConsoleTyper(out);
    // Show the last lines first, as a console would.
    out.scrollTop = out.scrollHeight;
    const checked = this.querySelector<HTMLElement>('[data-choice][aria-checked="true"]');
    this.#index = clampChoice(this.#data.choices, Number(checked?.dataset.choice ?? 0));
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKey);
    this.#updatePlay();
    this.toggleAttribute('data-ready', true);
    return true;
  }

  disconnectedCallback(): void {
    this.#typer?.cancel();
    this.removeAttribute('data-ready');
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKey);
  }

  /** Picks choice `index`, re-renders, and replays its console. `focus` moves focus to its radio. */
  select(index: number, focus = false): void {
    const data = this.#data;
    if (!data) return;
    const next = clampChoice(data.choices, index);
    const choice = data.choices[next];
    if (!choice) return;
    this.#index = next;
    const list = this.#part('choices');
    if (list) {
      list.innerHTML = renderChoices(data.choices, next);
      if (focus) list.querySelector<HTMLElement>(`[data-choice="${next}"]`)?.focus();
    }
    const scene = this.#part('scene');
    if (scene && this.scene) {
      const before = positions(scene, 'data-token');
      scene.innerHTML = this.scene(data, next);
      travelFrom(scene, 'data-token', before);
    }
    const outcome = this.#part('outcome');
    if (outcome) outcome.innerHTML = renderOutcome(choice);
    const where = this.#part('where');
    if (where) where.textContent = choice.where;
    const status = this.#part('status');
    if (status) status.textContent = replayStatus(choice);
    this.replay();
  }

  /** Types the current choice's console lines again; shows them at once with reduced motion. */
  replay(): void {
    const choice = this.#data?.choices[this.#index];
    const out = this.#part('console');
    if (!choice || !out) return;
    if (prefersReducedMotion()) {
      this.#typer?.cancel();
      out.innerHTML = renderReplayConsole(choice);
      out.scrollTop = out.scrollHeight;
      return;
    }
    this.#typer?.show(choice.lines, 0);
  }

  #updatePlay(): void {
    const button = this.#part('play');
    if (button) button.textContent = prefersReducedMotion() ? 'Next choice' : 'Replay console';
  }

  #onClick = (event: Event): void => {
    const target = event.target as Element;
    const choice = target.closest<HTMLElement>('[data-choice]');
    if (choice) {
      this.select(Number(choice.dataset.choice), true);
      return;
    }
    if (target.closest('[data-part="play"]')) {
      if (prefersReducedMotion()) this.select((this.#index + 1) % (this.#data?.choices.length ?? 1));
      else this.replay();
    }
  };

  #onKey = (event: KeyboardEvent): void => {
    if (!(event.target as Element).closest('[data-choice]')) return;
    const next = choiceKey(event.key, this.#index, this.#data?.choices.length ?? 0);
    if (next === undefined) return;
    event.preventDefault();
    this.select(next, true);
  };
}

/** Registers `tag` as a replay figure whose scene `scene` draws. */
export function defineReplayFigure<T extends ReplayData>(tag: string, scene?: SceneRenderer<T>): void {
  if (customElements.get(tag)) return;
  customElements.define(
    tag,
    class extends ReplayFigure<T> {
      protected override scene = scene;
    },
  );
}
