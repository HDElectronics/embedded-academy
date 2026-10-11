// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { prefersReducedMotion, TYPE_CPS, TYPE_MAX_MS } from './motion.ts';
import { clampPos, endOf, renderSerial, renderStrip, type SerialLog, stageAt } from './serial.ts';

/** Pause after a line is typed before the next one starts. */
const LINE_GAP_MS = 150;

/**
 * <ea-serial-console>: replays a log with a stage strip and a scrubber. The
 * server renders the whole log; Play types it again line by line, the strip
 * and scrubber jump to any point, and clicking a line jumps to its stage.
 */
export class EaSerialConsole extends HTMLElement {
  #log: SerialLog = { stages: [], lines: [] };
  #pos = 0;
  #timer: ReturnType<typeof setTimeout> | undefined;

  get pos(): number {
    return this.#pos;
  }

  get playing(): boolean {
    return this.#timer !== undefined;
  }

  #part<T extends HTMLElement = HTMLElement>(name: string): T | null {
    return this.querySelector<T>(`[data-part="${name}"]`);
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
    const json = this.querySelector('script[data-log]')?.textContent;
    if (!json || !this.#part('console')) return false;
    this.#log = JSON.parse(json) as SerialLog;
    this.#pos = this.#log.lines.length;
    this.addEventListener('click', this.#onClick);
    this.addEventListener('input', this.#onInput);
    this.#updatePlay();
    this.toggleAttribute('data-ready', true);
    return true;
  }

  disconnectedCallback(): void {
    this.stop();
    this.removeAttribute('data-ready');
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('input', this.#onInput);
  }

  /** Shows the log up to line `pos` (1-based). `fresh` types the last line. */
  seek(pos: number, fresh = false): void {
    this.#pos = clampPos(this.#log, pos);
    const out = this.#part('console');
    if (out) {
      out.innerHTML = renderSerial(this.#log, this.#pos, fresh && !prefersReducedMotion());
      const typing = out.querySelector<HTMLElement>('.is-typing');
      if (typing) typing.style.animationDuration = `${this.#typingMs(this.#pos)}ms`;
      out.scrollTop = out.scrollHeight;
    }
    const strip = this.#part('strip');
    if (strip) strip.innerHTML = renderStrip(this.#log, this.#pos);
    const scrub = this.#part<HTMLInputElement>('scrub');
    if (scrub) scrub.value = String(this.#pos);
    const where = this.#part('where');
    if (where) where.textContent = `line ${this.#pos}/${this.#log.lines.length}`;
  }

  play(): void {
    if (prefersReducedMotion()) {
      this.seek(this.#pos >= this.#log.lines.length ? 1 : this.#pos + 1);
      return;
    }
    if (this.playing) {
      this.stop();
      return;
    }
    const from = this.#pos >= this.#log.lines.length ? 1 : this.#pos + 1;
    const step = (pos: number) => {
      this.seek(pos, true);
      if (pos >= this.#log.lines.length) {
        this.#timer = undefined;
        this.#updatePlay();
        return;
      }
      this.#timer = setTimeout(() => step(pos + 1), this.#typingMs(pos) + LINE_GAP_MS);
    };
    this.#timer = setTimeout(() => step(from), 0);
    this.#updatePlay();
  }

  stop(): void {
    clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#updatePlay();
  }

  /** About 30 characters per second, never longer than TYPE_MAX_MS for one line. */
  #typingMs(pos: number): number {
    const text = this.#log.lines[pos - 1]?.text ?? '';
    return Math.min(TYPE_MAX_MS, Math.round((text.length / TYPE_CPS) * 1000));
  }

  #updatePlay(): void {
    const button = this.#part('play');
    if (!button) return;
    button.textContent = prefersReducedMotion() ? 'Next line' : this.playing ? 'Pause' : 'Replay log';
    button.setAttribute('aria-pressed', String(this.playing));
  }

  #onClick = (event: Event): void => {
    const target = event.target as Element;
    const seg = target.closest<HTMLElement>('[data-seek-stage]');
    const line = target.closest<HTMLElement>('[data-line]');
    const part = target.closest<HTMLElement>('[data-part]')?.dataset.part;
    if (seg) {
      this.stop();
      this.seek(endOf(this.#log, Number(seg.dataset.seekStage)));
      this.#part('strip')?.querySelector<HTMLElement>('[aria-current="step"]')?.focus();
    } else if (line) {
      this.stop();
      this.seek(endOf(this.#log, this.#log.lines[Number(line.dataset.line)]?.stage ?? 0));
    } else if (part === 'play') this.play();
    else if (part === 'next') {
      this.stop();
      this.seek(this.#pos + 1, true);
    } else if (part === 'prev') {
      this.stop();
      this.seek(this.#pos - 1);
    }
  };

  #onInput = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    if (input.dataset.part !== 'scrub') return;
    this.stop();
    this.seek(Number(input.value));
  };

  /** Index of the stage the console currently shows. */
  get stage(): number {
    return stageAt(this.#log, this.#pos);
  }
}

export function defineSerialConsole(): void {
  if (!customElements.get('ea-serial-console')) customElements.define('ea-serial-console', EaSerialConsole);
}
