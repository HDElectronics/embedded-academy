// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

/** Width from which a lesson becomes a split session. Below it, figures stay in the text. */
export const SPLIT_QUERY = '(min-width: 1100px)';

export type ZoomArea = '' | 'read' | 'windows' | 'serial';

/**
 * <ea-session>: lays a lesson out like a tmux session on wide screens. Figures
 * marked `data-window` move from the text into a windows pane with tabs; the
 * first serial console moves into its own pane. Each figure leaves a link in
 * the text that brings its window to the front. On narrow screens, or when the
 * screen narrows, every figure goes back where the author put it.
 */
export class EaSession extends HTMLElement {
  #media: MediaQueryList | undefined;
  #figures: { el: HTMLElement; ref: HTMLElement }[] = [];
  #active = 0;

  get split(): boolean {
    return this.dataset.layout === 'split';
  }

  get active(): number {
    return this.#active;
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
    if (!this.#part('read') || !this.#part('windows')) return false;
    this.#media = matchMedia(SPLIT_QUERY);
    this.#media.addEventListener('change', this.#layout);
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeydown);
    document.addEventListener('click', this.#onZoomClick);
    this.#layout();
    this.toggleAttribute('data-ready', true);
    return true;
  }

  disconnectedCallback(): void {
    this.#media?.removeEventListener('change', this.#layout);
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeydown);
    document.removeEventListener('click', this.#onZoomClick);
    this.removeAttribute('data-ready');
  }

  #layout = (): void => {
    if (this.#media?.matches) this.#split();
    else this.#inline();
  };

  #split(): void {
    if (this.#figures.length > 0) return;
    const read = this.#part('read');
    const windows = this.#part('windows');
    const serial = this.#part('serial');
    if (!read || !windows) return;
    const found = [...read.querySelectorAll<HTMLElement>('[data-window]')].filter(
      (el) => !el.parentElement?.closest('[data-window]'),
    );
    let tabs = 0;
    for (const el of found) {
      const toSerial = el.dataset.window === 'serial' && serial && serial.childElementCount === 0;
      const ref = document.createElement('p');
      ref.className = 'ea-session__ref';
      if (toSerial) {
        ref.innerHTML = '<span class="t-small">Shown in the serial pane.</span>';
      } else {
        const k = tabs++;
        ref.innerHTML = `<button type="button" class="ea-btn" data-show="${k}">Window ${k + 1}: ${el.dataset.window ?? 'figure'}</button>`;
        el.dataset.windowIndex = String(k);
      }
      el.before(ref);
      (toSerial ? serial : windows).append(el);
      this.#figures.push({ el, ref });
    }
    this.dataset.layout = 'split';
    this.dataset.serial = serial && serial.childElementCount > 0 ? 'yes' : 'no';
    this.dataset.windows = tabs > 0 ? 'yes' : 'no';
    this.#renderTabs();
    this.show(0);
  }

  #inline(): void {
    for (const { el, ref } of this.#figures) {
      ref.before(el);
      ref.remove();
      delete el.dataset.windowIndex;
      el.hidden = false;
    }
    this.#figures = [];
    this.dataset.layout = 'inline';
    this.#renderTabs();
    this.zoom('');
  }

  #windowFigures(): HTMLElement[] {
    return this.#figures.map((f) => f.el).filter((el) => el.dataset.windowIndex !== undefined);
  }

  #renderTabs(): void {
    const tabs = this.#part('tabs');
    if (!tabs) return;
    tabs.innerHTML = this.#windowFigures()
      .map(
        (el, k) =>
          `<button type="button" class="ea-tab" role="tab" id="session-tab-${k}" data-show="${k}" aria-selected="false" tabindex="-1">${k + 1}:${el.dataset.window ?? 'figure'}</button>`,
      )
      .join('');
  }

  /** Brings window `k` to the front. */
  show(k: number): void {
    const figures = this.#windowFigures();
    if (figures.length === 0) return;
    this.#active = Math.max(0, Math.min(figures.length - 1, k));
    figures.forEach((el, i) => {
      el.hidden = i !== this.#active;
    });
    for (const tab of this.querySelectorAll<HTMLElement>('[data-part="tabs"] [data-show]')) {
      const on = Number(tab.dataset.show) === this.#active;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    }
    if (this.dataset.zoom === 'read' || this.dataset.zoom === 'serial') this.zoom('');
  }

  /** Fills the session with one pane, like tmux's zoom; '' splits again. */
  zoom(area: ZoomArea): void {
    this.dataset.zoom = area;
    for (const b of document.querySelectorAll<HTMLElement>('[data-zoom-to]')) {
      b.setAttribute('aria-pressed', String(b.dataset.zoomTo === area));
    }
  }

  #onClick = (event: Event): void => {
    const show = (event.target as Element).closest<HTMLElement>('[data-show]');
    if (!show || !this.contains(show)) return;
    this.show(Number(show.dataset.show));
    if (show.closest('[data-part="tabs"]')) show.focus();
  };

  #onKeydown = (event: KeyboardEvent): void => {
    if (!(event.target as Element).closest('[data-part="tabs"]')) return;
    const count = this.#windowFigures().length;
    const k =
      event.key === 'ArrowRight'
        ? (this.#active + 1) % count
        : event.key === 'ArrowLeft'
          ? (this.#active - 1 + count) % count
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? count - 1
              : -1;
    if (k < 0) return;
    event.preventDefault();
    this.show(k);
    this.querySelector<HTMLElement>(`[data-part="tabs"] [data-show="${k}"]`)?.focus();
  };

  #onZoomClick = (event: Event): void => {
    const button = (event.target as Element).closest<HTMLElement>('[data-zoom-to]');
    if (button) this.zoom((button.dataset.zoomTo ?? '') as ZoomArea);
  };
}

export function defineSession(): void {
  if (!customElements.get('ea-session')) customElements.define('ea-session', EaSession);
}
