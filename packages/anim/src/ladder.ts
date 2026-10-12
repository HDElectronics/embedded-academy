// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// The privilege ladder: which level and security state each stage runs in.
// Rendered the same on the server and in the browser.

import { ARM_ARM_A, ARM_ARM_V7A, type Privilege, type Source } from '@ea/boards';
import { clampIndex, type StageState } from './model.ts';
import { esc } from './render.ts';
import type { ChainBoard } from './types.ts';

type Level = Privilege['level'];

/** Rows, most privileged first, with a short note on what runs there. */
/** `only`: the level exists in that security state alone. */
const LADDERS: Record<
  ChainBoard['arch'],
  { rows: { level: Level; note: string; only?: 'secure' | 'normal' }[]; source: Source }
> = {
  'armv8-a': {
    rows: [
      { level: 'EL3', note: 'secure monitor', only: 'secure' },
      { level: 'EL2', note: 'hypervisor' },
      { level: 'EL1', note: 'kernel' },
      { level: 'EL0', note: 'applications' },
    ],
    source: ARM_ARM_A,
  },
  'armv7-a': {
    rows: [
      { level: 'PL2', note: 'Hyp mode', only: 'normal' },
      { level: 'PL1', note: 'Monitor, SVC and other kernel modes' },
      { level: 'PL0', note: 'User mode' },
    ],
    source: ARM_ARM_V7A,
  },
};

export interface LadderState {
  index: number;
  /** Where the marker sits: a cell, or the firmware box when no Arm core runs yet. */
  at: { level: Level; world: Privilege['world'] } | 'firmware' | 'unknown';
  stages: { name: string; level: string; state: StageState }[];
}

export function ladderState(board: ChainBoard, index: number): LadderState {
  const i = clampIndex(board, index);
  const stage = board.stages[i];
  const at = stage?.privilege
    ? { level: stage.privilege.level, world: stage.privilege.world }
    : stage?.world === 'firmware'
      ? 'firmware'
      : 'unknown';
  return {
    index: i,
    at,
    stages: board.stages.map((s, k) => ({
      name: s.name,
      level: s.level,
      state: k < i ? 'ok' : k === i ? 'run' : 'wait',
    })),
  };
}

const STATE: Record<StageState, string> = { ok: '[  OK  ]', run: '[ RUN  ]', wait: '[ WAIT ]' };

/**
 * The grid of levels by security state, most privileged first, as the
 * privilege ladder draws it. `here` returns what a cell holds.
 */
export function renderLevelGrid(
  arch: ChainBoard['arch'],
  here: (level: Level, world: 'secure' | 'normal') => string,
): string {
  const rows = LADDERS[arch].rows
    .map(
      (r) =>
        `<div class="ea-ladder__level" role="rowheader"><b>${r.level}</b><span>${esc(r.note)}</span></div>` +
        (['secure', 'normal'] as const)
          .map((w) =>
            r.only && r.only !== w
              ? `<div class="ea-ladder__cell is-none" role="cell"><span aria-hidden="true">—</span><span class="visually-hidden">no ${r.level} in the ${w} world</span></div>`
              : `<div class="ea-ladder__cell is-${w}" role="cell">${here(r.level, w)}</div>`,
          )
          .join(''),
    )
    .map((cells) => `<div role="row" class="ea-ladder__row">${cells}</div>`)
    .join('');
  return (
    `<div class="ea-ladder__grid" role="table" aria-label="Privilege levels by security state">` +
    `<div role="row" class="ea-ladder__row"><span role="columnheader" class="ea-ladder__corner">level</span>` +
    `<span role="columnheader" class="ea-ladder__head is-secure">Secure world</span>` +
    `<span role="columnheader" class="ea-ladder__head is-normal">Normal world</span></div>${rows}</div>`
  );
}

export function renderLadder(board: ChainBoard, state: LadderState): string {
  const ladder = LADDERS[board.arch];
  const stage = board.stages[state.index];
  if (!stage) return '';
  const token =
    `<span class="ea-ladder__token" data-token="cpu">${esc(stage.name)}` +
    `<span class="ea-ladder__token-level"> · ${esc(stage.level)}</span></span>`;
  const here = (level: Level, world: string) =>
    typeof state.at === 'object' && state.at.level === level && state.at.world === world ? token : '';
  const firmware = board.stages.some((s) => s.world === 'firmware')
    ? `<div class="ea-ladder__firmware"><span class="ea-ladder__head">Firmware · no Arm core running yet</span>${state.at === 'firmware' ? token : ''}</div>`
    : '';
  const unknown =
    state.at === 'unknown'
      ? `<p class="ea-ladder__unknown">${token} Level and world for this stage are not stated by the sources yet.</p>`
      : '';
  const trail = state.stages
    .map(
      (s, k) =>
        `<li class="ea-ladder__step${s.state === 'run' ? ' is-current' : ''}" data-step="${k}">` +
        `<span class="ea-stage__state ea-stage__state--${s.state}">${STATE[s.state]}</span> ${esc(s.name)}` +
        `<span class="ea-ladder__step-level">${esc(s.level)}</span></li>`,
    )
    .join('');
  const src = ladder.source;
  return (
    firmware +
    unknown +
    renderLevelGrid(board.arch, here) +
    `<p class="ea-ladder__caption">${esc(stage.does[0] ?? '')}</p>` +
    `<ol class="ea-ladder__trail">${trail}</ol>` +
    `<p class="ea-chain__sources t-small">Levels: <a href="${esc(src.url ?? '')}" rel="noopener">${esc(src.title)}</a></p>`
  );
}
