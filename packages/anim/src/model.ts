// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import type { ChainBoard, ChainStage } from './types.ts';

export type StageState = 'ok' | 'run' | 'wait';

export interface ChainChip {
  stageId: string;
  label: string;
  active: boolean;
}

export interface ChainState {
  index: number;
  stage: ChainStage;
  stages: { id: string; state: StageState }[];
  regions: { id: string; lit: boolean; chips: ChainChip[] }[];
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

  return {
    index: i,
    stage,
    stages: board.stages.map((s, k) => ({ id: s.id, state: k < i ? 'ok' : k === i ? 'run' : 'wait' })),
    regions: board.regions.map((r) => {
      const chips = board.stages
        .map((s, k) => ({ s, k }))
        .filter(({ s, k }) => k <= i && s.region === r.id)
        .map(({ s, k }) => ({ stageId: s.id, label: chipLabel(s.file), active: k === i }));
      return { id: r.id, lit: chips.some((c) => c.active), chips };
    }),
    lines,
    newFrom,
  };
}
