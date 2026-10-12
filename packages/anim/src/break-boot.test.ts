// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT
// @vitest-environment happy-dom

import { breakBoot } from '@ea/boards';
import { captureSpan } from '@ea/boards/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { argDiff, argKey, renderBreakScene, toBreakBootFigure } from './break-boot.ts';
import { mountReplayForTest, part, radio } from './replay.test-helpers.ts';
import { gapNote } from './replay.ts';

const fig = toBreakBootFigure(breakBoot, captureSpan);
const index = (id: string) => fig.choices.findIndex((c) => c.id === id);

describe('argDiff', () => {
  const ref = ['console=ttyAMA0', 'root=/dev/vda', 'rootwait'];

  it('names an argument by what it sets', () => {
    expect(argKey('root=/dev/vda')).toBe('root');
    expect(argKey('rootwait')).toBe('rootwait');
    expect(argKey('earlycon=pl011,0x9000000')).toBe('earlycon');
  });

  it('marks changed, added and removed arguments against the reference', () => {
    expect(argDiff(ref, ref).every((a) => a.change === 'same')).toBe(true);
    expect(argDiff(ref, ['console=ttyS0', 'earlycon', 'root=/dev/vda', 'rootwait'])).toEqual([
      { arg: 'console=ttyS0', change: 'changed' },
      { arg: 'earlycon', change: 'added' },
      { arg: 'root=/dev/vda', change: 'same' },
      { arg: 'rootwait', change: 'same' },
    ]);
    expect(argDiff(ref, ['console=ttyAMA0', 'root=/dev/vdb'])).toEqual([
      { arg: 'console=ttyAMA0', change: 'same' },
      { arg: 'root=/dev/vdb', change: 'changed' },
      { arg: 'rootwait', change: 'removed' },
    ]);
  });
});

describe('the BreakBoot figure', () => {
  it('suffixes each run with the arguments it changed, read from its capture', () => {
    expect(fig.choices.map((c) => c.suffix)).toEqual([
      '',
      'console=ttyS0',
      'console=ttyS0 earlycon',
      'root=/dev/vdb',
      'root=/dev/vdb',
    ]);
    expect(fig.argsWhere[index('root-vdb')]).toBe('logs/qemu/m10-root-panic.log, line 41');
  });

  it('marks each change with a symbol and a word, not colour alone', () => {
    const html = renderBreakScene(fig, index('root-vdb'));
    expect(html).toContain('<span class="ea-break__mark" aria-hidden="true">*</span>root=/dev/vdb');
    expect(html).toContain('<s>rootwait</s><span class="visually-hidden"> (removed)</span>');
    expect(renderBreakScene(fig, 0)).toContain('The reference run.');
    expect(renderBreakScene(fig, 99)).toBe('');
  });

  it('notes the lines it leaves out between spans', () => {
    expect(fig.choices[index('rootwait')]?.lines).toContain(gapNote(3));
  });
});

describe('<ea-break-boot>', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('switches to rootwait with the keyboard and shows the wait at once with reduced motion', async () => {
    const el = await mountReplayForTest('ea-break-boot', fig, renderBreakScene, {
      reducedMotion: true,
      start: index('root-vdb'),
    });
    expect(part('outcome').textContent).toContain('[FAILED] kernel panic');
    radio(index('root-vdb')).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(el.index).toBe(index('rootwait'));
    expect(part('outcome').textContent).toContain('[ WAIT ]');
    expect(part('console').textContent).toContain('Waiting for root device /dev/vdb...');
    expect(part('scene').querySelector('.is-removed')).toBeNull();
  });
});
