// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { prefersReducedMotion } from './motion.ts';
import { ConsoleTyper } from './typer.ts';

/**
 * <ea-serial-console>: replays a captured log. The server renders the whole
 * log; Replay types it again from the start, Skip shows it all at once.
 */
export class EaSerialConsole extends HTMLElement {
  #lines: string[] = [];
  #typer: ConsoleTyper | undefined;

  connectedCallback(): void {
    // Children may not be parsed yet when the element connects: retry once they are.
    if (!this.#init())
      queueMicrotask(
        () => this.#init() || document.addEventListener('DOMContentLoaded', () => this.#init(), { once: true }),
      );
  }

  #init(): boolean {
    if (this.hasAttribute('data-ready')) return true;
    const json = this.querySelector('script[data-log]')?.textContent;
    const out = this.querySelector<HTMLElement>('[data-part="console"]');
    if (!json || !out) return false;
    this.#lines = JSON.parse(json) as string[];
    this.#typer = new ConsoleTyper(out);
    this.addEventListener('click', this.#onClick);
    const replay = this.querySelector<HTMLButtonElement>('[data-part="replay"]');
    if (replay && prefersReducedMotion()) replay.hidden = true;
    this.toggleAttribute('data-ready', true);
    return true;
  }

  disconnectedCallback(): void {
    this.#typer?.cancel();
    this.removeAttribute('data-ready');
    this.removeEventListener('click', this.#onClick);
  }

  replay(): void {
    this.#typer?.show(this.#lines, 0);
  }

  skip(): void {
    this.#typer?.show(this.#lines);
  }

  #onClick = (event: Event): void => {
    const part = (event.target as Element).closest<HTMLElement>('[data-part]')?.dataset.part;
    if (part === 'replay') this.replay();
    else if (part === 'skip') this.skip();
  };
}

export function defineSerialConsole(): void {
  if (!customElements.get('ea-serial-console')) customElements.define('ea-serial-console', EaSerialConsole);
}
