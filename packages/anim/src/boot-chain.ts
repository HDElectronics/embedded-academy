// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { chainState, clampIndex } from './model.ts';
import { enter, prefersReducedMotion } from './motion.ts';
import { renderDetail, renderMemory, renderRail, renderTabs } from './render.ts';
import { ConsoleTyper } from './typer.ts';
import type { ChainBoard } from './types.ts';

/** Pause after a stage's output finishes before Play moves on. */
const DWELL_MS = 900;

/**
 * <ea-boot-chain>: steps through a board's boot chain. The server renders the
 * first state; this element takes over for Play, stepping and board switching.
 */
export class EaBootChain extends HTMLElement {
  #boards: ChainBoard[] = [];
  #board = 0;
  #index = 0;
  #playing = false;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #typer: ConsoleTyper | undefined;

  #part<T extends HTMLElement = HTMLElement>(name: string): T | null {
    return this.querySelector<T>(`[data-part="${name}"]`);
  }

  get board(): ChainBoard {
    const b = this.#boards.at(this.#board);
    if (!b) throw new Error('ea-boot-chain: no board data');
    return b;
  }

  get index(): number {
    return this.#index;
  }

  get playing(): boolean {
    return this.#playing;
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
    const json = this.querySelector('script[data-chain]')?.textContent;
    if (!json) return false;
    this.#boards = JSON.parse(json) as ChainBoard[];
    this.#board = Number(this.dataset.initialBoard ?? 0);
    this.#index = Number(this.dataset.initialStage ?? 0);
    const consoleEl = this.#part('console');
    if (consoleEl) this.#typer = new ConsoleTyper(consoleEl);

    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeydown);
    this.#updatePlayButton();
    this.toggleAttribute('data-ready', true);
    return true;
  }

  disconnectedCallback(): void {
    this.stop();
    this.removeAttribute('data-ready');
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeydown);
  }

  select(index: number, animate = true): void {
    const board = this.board;
    const previous = this.#index;
    this.#index = clampIndex(board, index);
    const state = chainState(board, this.#index);
    const forward = animate && this.#index > previous;

    const rail = this.#part('rail');
    if (rail) rail.innerHTML = renderRail(board, state);
    const detail = this.#part('detail');
    if (detail) {
      detail.innerHTML = renderDetail(board, state);
      if (animate) enter([...detail.children], { y: 6 });
    }
    const memory = this.#part('memory');
    if (memory) {
      memory.innerHTML = renderMemory(board, state);
      const chip = memory.querySelector(`[data-chip="${CSS.escape(state.stage.id)}"]`);
      if (forward && chip) enter(chip, { x: -16 });
    }
    const status = this.#part('status');
    if (status) status.textContent = `Stage ${this.#index + 1} of ${board.stages.length}: ${state.stage.name}`;

    this.#typer?.show(state.lines, forward ? state.newFrom : state.lines.length, () => this.#afterOutput());
  }

  selectBoard(k: number): void {
    if (k < 0 || k >= this.#boards.length || k === this.#board) return;
    this.stop();
    this.#board = k;
    const tabs = this.#part('tabs');
    if (tabs) tabs.innerHTML = renderTabs(this.#boards, k);
    const meta = this.#part('meta');
    if (meta) meta.textContent = `${this.board.soc} · ${this.board.cpu}`;
    const summary = this.#part('summary');
    if (summary) summary.textContent = this.board.summary;
    this.#index = 0;
    this.select(0, false);
    tabs?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
  }

  next(): void {
    this.select(this.#index + 1);
  }

  previous(): void {
    this.select(this.#index - 1, false);
  }

  play(): void {
    if (prefersReducedMotion()) {
      this.next();
      return;
    }
    if (this.#playing) {
      this.stop();
      return;
    }
    this.#playing = true;
    this.#updatePlayButton();
    if (this.#index >= this.board.stages.length - 1) this.select(0, false);
    else this.next();
  }

  stop(): void {
    this.#playing = false;
    clearTimeout(this.#timer);
    this.#updatePlayButton();
  }

  #afterOutput(): void {
    if (!this.#playing) return;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      if (!this.#playing) return;
      if (this.#index >= this.board.stages.length - 1) this.stop();
      else this.next();
    }, DWELL_MS);
  }

  #updatePlayButton(): void {
    const button = this.#part<HTMLButtonElement>('play');
    if (!button) return;
    if (prefersReducedMotion()) button.textContent = 'Next stage';
    else button.textContent = this.#playing ? 'Pause' : 'Play boot';
    button.setAttribute('aria-pressed', String(this.#playing));
  }

  #onClick = (event: Event): void => {
    const target = (event.target as Element).closest<HTMLElement>('[data-stage],[data-board],[data-part]');
    if (!target || !this.contains(target)) return;
    if (target.dataset.stage !== undefined) {
      this.stop();
      this.select(Number(target.dataset.stage));
      this.#part('rail')?.querySelector<HTMLElement>(`[data-stage="${this.#index}"]`)?.focus();
    } else if (target.dataset.board !== undefined) {
      this.selectBoard(Number(target.dataset.board));
    } else if (target.dataset.part === 'play') {
      this.play();
    } else if (target.dataset.part === 'next') {
      this.stop();
      this.next();
    } else if (target.dataset.part === 'prev') {
      this.stop();
      this.previous();
    }
  };

  #onKeydown = (event: KeyboardEvent): void => {
    const el = event.target as HTMLElement;
    const inTabs = el.closest('[data-part="tabs"]');
    const inRail = el.closest('[data-part="rail"]');
    if (!inTabs && !inRail) return;
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    const edge = event.key === 'Home' ? 'first' : event.key === 'End' ? 'last' : undefined;
    if (!step && !edge) return;
    event.preventDefault();
    if (inTabs) {
      const last = this.#boards.length - 1;
      const k =
        edge === 'first'
          ? 0
          : edge === 'last'
            ? last
            : (this.#board + step + this.#boards.length) % this.#boards.length;
      this.selectBoard(k);
    } else {
      this.stop();
      const last = this.board.stages.length - 1;
      this.select(edge === 'first' ? 0 : edge === 'last' ? last : this.#index + step, step > 0);
      this.#part('rail')?.querySelector<HTMLElement>(`[data-stage="${this.#index}"]`)?.focus();
    }
  };
}

export function defineBootChain(): void {
  if (!customElements.get('ea-boot-chain')) customElements.define('ea-boot-chain', EaBootChain);
}
