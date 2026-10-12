// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// BreakBoot: the kernel command line of each run, compared with the reference
// run, above the replayed console. Rendered the same on the server and in the
// browser.

import { type BreakBoot, bootargsFrom } from '@ea/boards';
import { esc } from './render.ts';
import { type ReplayData, type SpanReader, spanWhere, toReplayChoice } from './replay.ts';

export type ArgChange = 'same' | 'changed' | 'added' | 'removed';

export interface BreakBootFigure extends ReplayData {
  /** Each run's kernel arguments, compared with the first run's. */
  args: { arg: string; change: ArgChange }[][];
  /** Where each run's arguments were read. */
  argsWhere: string[];
}

/** The name an argument sets: `root` for `root=/dev/vda`, the whole word for a flag. */
export function argKey(arg: string): string {
  const eq = arg.indexOf('=');
  return eq < 0 ? arg : arg.slice(0, eq);
}

/** `run` compared with `reference`, by argument name; removed arguments come last. */
export function argDiff(reference: string[], run: string[]): { arg: string; change: ArgChange }[] {
  const keys = new Set(run.map(argKey));
  const shown = run.map((arg) => {
    const change: ArgChange = reference.includes(arg)
      ? 'same'
      : reference.some((r) => argKey(r) === argKey(arg))
        ? 'changed'
        : 'added';
    return { arg, change };
  });
  const removed = reference.filter((r) => !keys.has(argKey(r))).map((arg) => ({ arg, change: 'removed' as const }));
  return [...shown, ...removed];
}

export function toBreakBootFigure(data: BreakBoot, read: SpanReader): BreakBootFigure {
  const argsOf = data.runs.map((r) => {
    const args = bootargsFrom(read(r.bootargs)[0] ?? '');
    if (!args) throw new Error(`BreakBoot: no bootargs in ${r.bootargs.log}:${r.bootargs.from}`);
    return args;
  });
  const reference = argsOf[0] ?? [];
  const args = argsOf.map((a) => argDiff(reference, a));
  const changed = (k: number) =>
    (args[k] ?? [])
      .filter((a) => a.change === 'changed' || a.change === 'added')
      .map((a) => a.arg)
      .join(' ');
  return {
    choices: data.runs.map((r, k) => toReplayChoice(r, read, changed(k))),
    args,
    argsWhere: data.runs.map((r) => spanWhere([r.bootargs])),
  };
}

const MARK: Record<ArgChange, string> = { same: '', changed: '*', added: '+', removed: '-' };

export function renderBreakScene(fig: BreakBootFigure, index: number): string {
  const args = fig.args[index];
  if (!args) return '';
  const items = args
    .map(({ arg, change }) => {
      const text = change === 'removed' ? `<s>${esc(arg)}</s>` : esc(arg);
      const mark = MARK[change] ? `<span class="ea-break__mark" aria-hidden="true">${MARK[change]}</span>` : '';
      const word = change === 'same' ? '' : `<span class="visually-hidden"> (${change})</span>`;
      return `<li class="ea-break__arg is-${change}" data-token="arg-${esc(argKey(arg))}">${mark}${text}${word}</li>`;
    })
    .join('');
  return (
    '<p class="ea-pane__label">Kernel command line</p>' +
    `<ul class="ea-break__args" aria-label="Kernel command line, compared with the reference run">${items}</ul>` +
    `<p class="ea-break__key t-small">${index === 0 ? 'The reference run.' : '* changed, + added, - removed, compared with the reference run.'} ` +
    `Read from ${esc(fig.argsWhere[index] ?? '')}.</p>`
  );
}
