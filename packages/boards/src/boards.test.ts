// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';
import { Board, boards, formatAddress, getBoard, REQUIRED_LOG_HEADERS } from './index.ts';
import { readBoardLog } from './node.ts';

describe.each(boards.map((b) => [b.id, b] as const))('board %s', (_id, board) => {
  it('matches the schema', () => {
    expect(() => Board.parse(board)).not.toThrow();
  });

  it('has unique stage and region ids', () => {
    const stageIds = board.stages.map((s) => s.id);
    const regionIds = board.regions.map((r) => r.id);
    expect(new Set(stageIds).size).toBe(stageIds.length);
    expect(new Set(regionIds).size).toBe(regionIds.length);
  });

  it('runs every stage in a region it defines', () => {
    const regionIds = new Set(board.regions.map((r) => r.id));
    for (const stage of board.stages) expect(regionIds, stage.id).toContain(stage.region);
  });

  it('loads images only into regions it defines, inside their bounds', () => {
    const regions = new Map(board.regions.map((r) => [r.id, r]));
    for (const load of board.stages.flatMap((s) => s.loads ?? [])) {
      const region = regions.get(load.to);
      expect(region, load.file).toBeDefined();
      if (load.address === undefined || region?.base === undefined) continue;
      expect(load.address, load.file).toBeGreaterThanOrEqual(region.base);
      if (region.size !== undefined) expect(load.address, load.file).toBeLessThan(region.base + region.size);
    }
  });

  it('places stages on the ladder of its architecture, matching the world', () => {
    const levels = board.arch === 'armv8-a' ? ['EL3', 'EL2', 'EL1', 'EL0'] : ['PL2', 'PL1', 'PL0'];
    for (const stage of board.stages) {
      if (!stage.privilege) continue;
      expect(levels, stage.id).toContain(stage.privilege.level);
      expect(stage.privilege.world, stage.id).toBe(stage.world);
    }
  });

  it('starts in ROM and ends in Linux', () => {
    const first = board.stages.at(0);
    const last = board.stages.at(-1);
    const firstRegion = board.regions.find((r) => r.id === first?.region);
    expect(firstRegion?.kind).toBe('rom');
    expect(last?.id).toBe('linux');
  });

  it('has no overlapping regions where addresses are known', () => {
    const placed = board.regions
      .filter((r) => r.base !== undefined && r.size !== undefined)
      .map((r) => ({ id: r.id, start: r.base as number, end: (r.base as number) + (r.size as number) }))
      .sort((a, b) => a.start - b.start);
    for (let i = 1; i < placed.length; i++) {
      const prev = placed.at(i - 1);
      const cur = placed.at(i);
      if (prev && cur) expect(cur.start, `${prev.id} overlaps ${cur.id}`).toBeGreaterThanOrEqual(prev.end);
    }
  });

  it('has a log with the required header and one chunk per stage', () => {
    const log = readBoardLog(board);
    for (const key of REQUIRED_LOG_HEADERS) expect(log.header, key).toHaveProperty(key);
    expect([...log.stages.keys()]).toEqual(board.stages.map((s) => s.id));
    for (const [id, lines] of log.stages) expect(lines.length, id).toBeGreaterThan(0);
  });

  it('never claims hardware verification for an uncaptured log', () => {
    const log = readBoardLog(board);
    if (log.header.captured === 'no') expect(log.header.verification).not.toBe('hardware');
  });
});

describe('getBoard', () => {
  it('finds a board by id', () => {
    expect(getBoard('bbb').name).toBe('BeagleBone Black');
  });
});

describe('formatAddress', () => {
  it('groups 32-bit addresses with an underscore', () => {
    expect(formatAddress(0x402f0400)).toBe('0x402F_0400');
    expect(formatAddress(0)).toBe('0x0000_0000');
  });
});
