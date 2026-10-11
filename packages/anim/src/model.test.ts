// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { boards, getBoard } from '@ea/boards';
import { readBoardLog } from '@ea/boards/node';
import { describe, expect, it } from 'vitest';
import { chainState, chipLabel, clampIndex } from './model.ts';
import { toChainBoard } from './types.ts';

const chains = boards.map((b) => toChainBoard(b, readBoardLog(b)));

describe.each(chains.map((c) => [c.id, c] as const))('chain %s', (_id, chain) => {
  it('marks earlier stages ok, the current one running, later ones waiting', () => {
    const s = chainState(chain, 2);
    expect(s.stages.map((x) => x.state)).toEqual(chain.stages.map((_, k) => (k < 2 ? 'ok' : k === 2 ? 'run' : 'wait')));
  });

  it('lights exactly the region of the current stage', () => {
    chain.stages.forEach((stage, k) => {
      const s = chainState(chain, k);
      expect(s.regions.filter((r) => r.lit).map((r) => r.id)).toEqual([stage.region]);
    });
  });

  it('accumulates console output and marks where the current stage starts', () => {
    const last = chain.stages.length - 1;
    const s = chainState(chain, last);
    expect(s.lines).toEqual(chain.stages.flatMap((x) => x.log));
    expect(s.lines.slice(s.newFrom)).toEqual(chain.stages.at(last)?.log);
  });

  it('clamps out-of-range indices', () => {
    expect(clampIndex(chain, -3)).toBe(0);
    expect(clampIndex(chain, 99)).toBe(chain.stages.length - 1);
  });
});

describe('memory images', () => {
  const bbb = toChainBoard(getBoard('bbb'), readBoardLog(getBoard('bbb')));
  const dram = (i: number) => chainState(bbb, i).regions.find((r) => r.id === 'dram')?.images ?? [];

  it('keeps images in storage until a stage loads them', () => {
    const files = chainState(bbb, 0).storage.flatMap((g) => g.files);
    expect(files).toEqual(['u-boot.img', 'zImage', 'dtb']);
    expect(
      chainState(bbb, 0)
        .regions.find((r) => r.id === 'sram')
        ?.images.map((m) => m.file),
    ).toEqual(['MLO']);
  });

  it('moves a reloaded image instead of copying it, and lists the top of a region first', () => {
    expect(dram(1).map((m) => [m.file, m.top, m.fresh])).toEqual([['u-boot.img', false, true]]);
    expect(dram(2).map((m) => [m.file, m.address, m.top])).toEqual([
      ['u-boot.img', '', true],
      ['dtb', '0x8800_0000', false],
      ['zImage', '0x8200_0000', false],
    ]);
    expect(chainState(bbb, 2).storage).toEqual([]);
  });

  it('lights the region where the current stage runs', () => {
    expect(
      chainState(bbb, 1)
        .regions.filter((r) => r.lit)
        .map((r) => r.id),
    ).toEqual(['sram']);
  });
});

describe('chipLabel', () => {
  it('drops a trailing parenthetical', () => {
    expect(chipLabel('u-boot.bin (optional)')).toBe('u-boot.bin');
    expect(chipLabel('(mask ROM)')).toBe('(mask ROM)');
    expect(chipLabel('MLO')).toBe('MLO');
  });
});
