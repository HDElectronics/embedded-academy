// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT
// @vitest-environment happy-dom

import { boards } from '@ea/boards';
import { readBoardLog } from '@ea/boards/node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineBootChain, type EaBootChain } from './boot-chain.ts';
import { chainState } from './model.ts';
import { renderRail, renderTabs } from './render.ts';
import { toChainBoard } from './types.ts';

const data = boards.map((b) => toChainBoard(b, readBoardLog(b)));

async function mount(reducedMotion = false): Promise<EaBootChain> {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({ matches: reducedMotion && query.includes('reduce'), media: query }) as MediaQueryList,
  );
  defineBootChain();
  const first = data[0];
  if (!first) throw new Error('no data');
  document.body.innerHTML = `
    <ea-boot-chain data-initial-board="0" data-initial-stage="0">
      <script type="application/json" data-chain>${JSON.stringify(data)}</script>
      <span data-part="meta"></span><p data-part="summary"></p>
      <div data-part="tabs">${renderTabs(data, 0)}</div>
      <button data-part="prev">Previous</button><button data-part="play">Play boot</button><button data-part="next">Next</button>
      <p data-part="status"></p>
      <ol data-part="rail">${renderRail(first, chainState(first, 0))}</ol>
      <div data-part="detail"></div><div data-part="memory"></div><div data-part="console"></div>
    </ea-boot-chain>`;
  const el = document.querySelector('ea-boot-chain');
  if (!el) throw new Error('not mounted');
  await Promise.resolve();
  return el as EaBootChain;
}

const part = (name: string) => document.querySelector<HTMLElement>(`[data-part="${name}"]`);

describe('<ea-boot-chain>', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('steps forward and back with the buttons', async () => {
    const el = await mount();
    part('next')?.click();
    expect(el.index).toBe(1);
    expect(part('status')?.textContent).toMatch(/^Stage 2 of \d+: /);
    part('prev')?.click();
    expect(el.index).toBe(0);
  });

  it('selects a stage clicked on the rail', async () => {
    const el = await mount();
    document.querySelector<HTMLElement>('[data-stage="3"]')?.click();
    expect(el.index).toBe(3);
    expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  });

  it('plays through every stage and stops at the end', async () => {
    const el = await mount();
    part('play')?.click();
    expect(el.playing).toBe(true);
    expect(part('play')?.textContent).toBe('Pause');
    vi.runAllTimers();
    expect(el.index).toBe(el.board.stages.length - 1);
    expect(el.playing).toBe(false);
    expect(part('play')?.textContent).toBe('Play boot');
  });

  it('switches boards with the arrow keys on the tabs', async () => {
    const el = await mount();
    const tab = document.querySelector<HTMLElement>('[data-board="0"]');
    tab?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(el.board.id).toBe(data[1]?.id);
    expect(el.index).toBe(0);
    expect(document.querySelector('[aria-selected="true"]')?.getAttribute('data-board')).toBe('1');
  });

  it('turns Play into Next and prints output at once with reduced motion', async () => {
    const el = await mount(true);
    expect(part('play')?.textContent).toBe('Next stage');
    part('play')?.click();
    expect(el.index).toBe(1);
    expect(el.playing).toBe(false);
    const expected = chainState(el.board, 1).lines;
    expect(part('console')?.querySelectorAll('.ea-console__line')).toHaveLength(expected.length);
  });
});
