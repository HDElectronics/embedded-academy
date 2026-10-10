// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { prefersReducedMotion, typingCadence } from './motion.ts';
import { renderConsole, renderLine } from './render.ts';

/**
 * Writes console lines into an element. Lines before `newFrom` appear at once;
 * the rest are typed. A new call cancels the previous one.
 */
export class ConsoleTyper {
  #job = 0;
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly el: HTMLElement) {}

  show(lines: string[], newFrom = lines.length, onDone?: () => void): void {
    const job = ++this.#job;
    clearTimeout(this.#timer);
    const done = lines.slice(0, newFrom);
    const pending = lines.slice(newFrom);

    if (pending.length === 0 || prefersReducedMotion()) {
      this.el.innerHTML = renderConsole(lines) + this.#cursor();
      this.#scroll();
      onDone?.();
      return;
    }

    this.el.innerHTML = renderConsole(done);
    const cadence = typingCadence(pending.reduce((n, l) => n + l.length, 0));
    let lineIndex = 0;
    let charIndex = 0;
    let row: HTMLElement | undefined;

    const tick = () => {
      if (job !== this.#job) return;
      const full = pending.at(lineIndex);
      if (full === undefined) {
        this.el.insertAdjacentHTML('beforeend', this.#cursor());
        this.#scroll();
        onDone?.();
        return;
      }
      if (!row) {
        row = document.createElement('div');
        row.className = 'ea-console__line';
        this.el.append(row);
      }
      charIndex = Math.min(full.length, charIndex + cadence.chars);
      row.textContent = full.slice(0, charIndex);
      if (charIndex >= full.length) {
        row.innerHTML = renderLine(full);
        row = undefined;
        lineIndex++;
        charIndex = 0;
      }
      this.#scroll();
      this.#timer = setTimeout(tick, cadence.interval);
    };
    tick();
  }

  cancel(): void {
    this.#job++;
    clearTimeout(this.#timer);
  }

  #cursor(): string {
    return '<span class="ea-console__cursor" aria-hidden="true"></span>';
  }

  #scroll(): void {
    this.el.scrollTop = this.el.scrollHeight;
  }
}
