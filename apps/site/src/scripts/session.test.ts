// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT
// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineSession, type EaSession } from './session.ts';

/** A matchMedia stub whose result the test can flip, firing `change`. */
function stubMedia(wide: boolean) {
  const listeners: (() => void)[] = [];
  const media = {
    matches: wide,
    media: '',
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    removeEventListener: () => {},
  };
  vi.stubGlobal('matchMedia', () => media);
  return (next: boolean) => {
    media.matches = next;
    for (const fn of listeners) fn();
  };
}

async function mount(wide: boolean) {
  const resize = stubMedia(wide);
  defineSession();
  document.body.innerHTML = `
    <ea-session data-layout="inline">
      <div data-part="read">
        <p>Intro</p>
        <section data-window="boot-chain" id="chain">chain</section>
        <p>Middle</p>
        <section data-window="serial" id="serial">serial</section>
        <section data-window="privilege" id="ladder">ladder</section>
      </div>
      <div data-part="tabs"></div><div data-part="windows"></div><div data-part="serial"></div>
    </ea-session>
    <button data-zoom-to="read" aria-pressed="false">0:read</button>`;
  await Promise.resolve();
  const el = document.querySelector('ea-session') as EaSession;
  return { el, resize };
}

const q = (s: string) => document.querySelector<HTMLElement>(s);

describe('<ea-session>', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('leaves figures in the text on narrow screens', async () => {
    const { el } = await mount(false);
    expect(el.split).toBe(false);
    expect(q('[data-part="read"] #chain')).not.toBeNull();
    expect(q('[data-part="tabs"]')?.children).toHaveLength(0);
  });

  it('moves figures into windows and the first serial console into its pane on wide screens', async () => {
    const { el } = await mount(true);
    expect(el.split).toBe(true);
    expect(q('[data-part="windows"] #chain')).not.toBeNull();
    expect(q('[data-part="windows"] #ladder')).not.toBeNull();
    expect(q('[data-part="serial"] #serial')).not.toBeNull();
    expect(q('[data-part="tabs"]')?.children).toHaveLength(2);
    expect(q('#chain')?.hidden).toBe(false);
    expect(q('#ladder')?.hidden).toBe(true);
    expect(document.querySelectorAll('.ea-session__ref')).toHaveLength(3);
  });

  it('brings a window to the front from its link in the text', async () => {
    const { el } = await mount(true);
    q('.ea-session__ref [data-show="1"]')?.click();
    expect(el.active).toBe(1);
    expect(q('#ladder')?.hidden).toBe(false);
    expect(q('[data-part="tabs"] [data-show="1"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('moves between tabs with the arrow keys', async () => {
    const { el } = await mount(true);
    q('[data-part="tabs"] [data-show="0"]')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(el.active).toBe(1);
  });

  it('zooms a pane from the status line', async () => {
    const { el } = await mount(true);
    q('[data-zoom-to="read"]')?.click();
    expect(el.dataset.zoom).toBe('read');
    expect(q('[data-zoom-to="read"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('puts every figure back where it was when the screen narrows', async () => {
    const { el, resize } = await mount(true);
    resize(false);
    expect(el.split).toBe(false);
    const order = [...(q('[data-part="read"]')?.children ?? [])].map((c) => c.id || c.textContent);
    expect(order).toEqual(['Intro', 'chain', 'Middle', 'serial', 'ladder']);
    expect(document.querySelectorAll('.ea-session__ref')).toHaveLength(0);
  });
});
