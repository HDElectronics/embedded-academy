// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import type { ChainBoard, ChainStage } from './types.ts';

export type StageState = 'ok' | 'run' | 'wait';

/** An image resident in memory, or still waiting in storage. */
export interface MemoryImage {
  file: string;
  address: string;
  top: boolean;
  /** True when the current stage put it here. */
  fresh: boolean;
}

export interface ChainState {
  index: number;
  stage: ChainStage;
  stages: { id: string; state: StageState }[];
  /** `lit`: the current stage runs in this region. */
  regions: { id: string; lit: boolean; images: MemoryImage[] }[];
  /** Images later stages will load, grouped by where they are read from. */
  storage: { from: string; files: string[] }[];
  /** Console lines printed up to and including the current stage. */
  lines: string[];
  /** Index in `lines` where the current stage's output starts. */
  newFrom: number;
}

export function clampIndex(board: ChainBoard, index: number): number {
  return Math.max(0, Math.min(board.stages.length - 1, Math.trunc(index)));
}

/** Drops a trailing parenthetical: "u-boot.bin (optional)" becomes "u-boot.bin". */
export function chipLabel(file: string): string {
  return file.replace(/\s*\([^)]*\)$/, '') || file;
}

export function chainState(board: ChainBoard, index: number): ChainState {
  const i = clampIndex(board, index);
  const stage = board.stages.at(i);
  if (!stage) throw new Error(`Board ${board.id} has no stages`);

  const lines: string[] = [];
  let newFrom = 0;
  board.stages.forEach((s, k) => {
    if (k > i) return;
    if (k === i) newFrom = lines.length;
    lines.push(...s.log);
  });

  // Replay every load up to this stage. A file loaded again moves (U-Boot relocating itself).
  const where = new Map<string, { region: string; image: MemoryImage }>();
  board.stages.forEach((s, k) => {
    if (k > i) return;
    for (const l of s.loads) {
      where.delete(l.file);
      where.set(l.file, { region: l.to, image: { file: l.file, address: l.address, top: l.top, fresh: k === i } });
    }
  });
  // Storage lists what later stages read from devices; images made from other images or regions stay out.
  const made = new Set([
    ...board.regions.map((r) => r.label),
    ...board.stages.flatMap((s) => s.loads.map((l) => l.file)),
  ]);
  const storage: { from: string; files: string[] }[] = [];
  for (const l of board.stages.slice(i + 1).flatMap((s) => s.loads)) {
    if (where.has(l.file) || made.has(l.from)) continue;
    const group = storage.find((g) => g.from === l.from) ?? storage[storage.push({ from: l.from, files: [] }) - 1];
    if (group && !group.files.includes(l.file)) group.files.push(l.file);
  }
  const imagesIn = (region: string) =>
    [...where.values()]
      .filter((w) => w.region === region)
      .map((w) => w.image)
      .sort((a, b) => Number(b.top) - Number(a.top) || b.address.localeCompare(a.address));

  return {
    index: i,
    stage,
    stages: board.stages.map((s, k) => ({ id: s.id, state: k < i ? 'ok' : k === i ? 'run' : 'wait' })),
    regions: board.regions.map((r) => ({ id: r.id, lit: stage.region === r.id, images: imagesIn(r.id) })),
    storage,
    lines,
    newFrom,
  };
}
