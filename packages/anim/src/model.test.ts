// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { boards } from '@ea/boards';
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

describe('chipLabel', () => {
  it('drops a trailing parenthetical', () => {
    expect(chipLabel('u-boot.bin (optional)')).toBe('u-boot.bin');
    expect(chipLabel('(mask ROM)')).toBe('(mask ROM)');
    expect(chipLabel('MLO')).toBe('MLO');
  });
});
