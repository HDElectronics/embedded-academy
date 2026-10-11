// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// The serial console timeline: log lines tagged with the stage that printed
// them, a stage strip and a scrubber. Rendered the same on the server and in
// the browser.

import type { StageState } from './model.ts';
import { esc, renderLine } from './render.ts';
import type { ChainBoard } from './types.ts';

export interface SerialLog {
  stages: string[];
  /** Every log line, with the index of the stage that printed it. */
  lines: { stage: number; text: string }[];
}

export function toSerialLog(board: ChainBoard): SerialLog {
  return {
    stages: board.stages.map((s) => s.name),
    lines: board.stages.flatMap((s, k) => s.log.map((text) => ({ stage: k, text }))),
  };
}

/** Lines shown, between 1 and all of them. */
export function clampPos(log: SerialLog, pos: number): number {
  return Math.max(1, Math.min(log.lines.length, Math.trunc(pos)));
}

/** The stage that printed the last line shown. */
export function stageAt(log: SerialLog, pos: number): number {
  return log.lines[clampPos(log, pos) - 1]?.stage ?? 0;
}

/** Position that shows a stage's output to its last line. */
export function endOf(log: SerialLog, stage: number): number {
  const last = log.lines.findLastIndex((l) => l.stage <= stage);
  return clampPos(log, last + 1);
}

const STATE: Record<StageState, string> = { ok: '[  OK  ]', run: '[ RUN  ]', wait: '[ WAIT ]' };

export function renderStrip(log: SerialLog, pos: number): string {
  const current = stageAt(log, pos);
  return log.stages
    .map((name, k) => {
      const state: StageState = k < current ? 'ok' : k === current ? 'run' : 'wait';
      return (
        `<li><button type="button" class="ea-serial__seg is-${state}" data-seek-stage="${k}" aria-current="${state === 'run' ? 'step' : 'false'}">` +
        `<span class="ea-stage__state ea-stage__state--${state}">${STATE[state]}</span><span class="ea-serial__name">${esc(name)}</span></button></li>`
      );
    })
    .join('');
}

/** Log lines up to `pos`, each with the stage that printed it. `fresh` marks the last line for the typing effect. */
export function renderSerial(log: SerialLog, pos: number, fresh = false): string {
  const shown = clampPos(log, pos);
  const current = stageAt(log, shown);
  return (
    log.lines
      .slice(0, shown)
      .map(
        (l, k) =>
          `<div class="ea-console__line ea-serial__line${l.stage === current ? ' is-current' : ''}" data-line="${k}">` +
          `<span class="ea-serial__src">${esc(log.stages[l.stage] ?? '')}</span>` +
          `<span class="ea-serial__text${fresh && k === shown - 1 ? ' is-typing' : ''}">${renderLine(l.text)}</span></div>`,
      )
      .join('') + '<span class="ea-console__cursor" aria-hidden="true"></span>'
  );
}
