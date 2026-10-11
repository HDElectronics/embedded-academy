// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT
// @vitest-environment happy-dom

import { getBoard } from '@ea/boards';
import { readBoardLog } from '@ea/boards/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineLadderForTest } from './ladder.test-helpers.ts';
import { ladderState, renderLadder } from './ladder.ts';
import { toChainBoard } from './types.ts';

const chain = (id: 'rpi4' | 'bbb' | 'stm32mp157') => toChainBoard(getBoard(id), readBoardLog(getBoard(id)));

describe('ladderState', () => {
  const rpi4 = chain('rpi4');

  it('keeps the marker in the firmware box while no Arm core runs', () => {
    expect(ladderState(rpi4, 0).at).toBe('firmware');
  });

  it('moves the marker to the level and world the board data states', () => {
    expect(ladderState(rpi4, 3).at).toEqual({ level: 'EL3', world: 'secure' });
    expect(ladderState(rpi4, 4).at).toEqual({ level: 'EL2', world: 'normal' });
  });

  it('says so when the sources do not state the level and world', () => {
    expect(ladderState(chain('bbb'), 0).at).toBe('unknown');
    expect(renderLadder(chain('bbb'), ladderState(chain('bbb'), 0))).toContain('not stated by the sources');
  });

  it('draws exactly one marker, with the Armv7-A levels for the STM32MP157', () => {
    const stm = chain('stm32mp157');
    const html = renderLadder(stm, ladderState(stm, 3));
    expect(html.match(/data-token=/g)).toHaveLength(1);
    expect(html).toContain('<b>PL1</b>');
    expect(html).not.toContain('<b>EL3</b>');
    expect(html).toContain('no PL2 in the secure world');
  });
});

describe('<ea-privilege-ladder>', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('steps with Next and Previous, and plays to the end', async () => {
    vi.useFakeTimers();
    const el = await defineLadderForTest(chain('rpi4'));
    const click = (part: string) => document.querySelector<HTMLElement>(`[data-part="${part}"]`)?.click();
    click('next');
    expect(el.index).toBe(1);
    click('prev');
    expect(el.index).toBe(0);
    click('play');
    expect(el.playing).toBe(true);
    vi.runAllTimers();
    expect(el.index).toBe(5);
    expect(el.playing).toBe(false);
  });

  it('turns Play into Next with reduced motion', async () => {
    const el = await defineLadderForTest(chain('rpi4'), true);
    const play = document.querySelector<HTMLElement>('[data-part="play"]');
    expect(play?.textContent).toBe('Next stage');
    play?.click();
    expect(el.index).toBe(1);
    expect(el.playing).toBe(false);
  });
});
