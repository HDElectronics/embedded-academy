// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// The exception level elevator: svc, hvc, smc and eret move the core between
// AArch64 exception levels, following the rules in the figure's data.
// Rendered the same on the server and in the browser.

import type { ElLevel, ElOp, ElRule, ExceptionLevelsFigure, Source } from '@ea/boards';
import { renderLevelGrid } from './ladder.ts';
import { esc } from './render.ts';

/** A return the core can still make: eret at `level` goes back to `back`. */
export interface PendingReturn {
  level: ElLevel;
  back: ElLevel;
}

export interface ElevatorState {
  at: ElLevel;
  /** Pending returns, oldest first: the last one is what the next eret uses. */
  pending: PendingReturn[];
}

export interface ElOutcome {
  op: ElOp;
  rule: ElRule;
  from: ElLevel;
  /** Level after the instruction; equal to `from` when the core did not move. */
  to: ElLevel;
}

export function startState(fig: ExceptionLevelsFigure): ElevatorState {
  return { at: fig.start, pending: [] };
}

export function ruleFor(fig: ExceptionLevelsFigure, op: ElOp, at: ElLevel): ElRule {
  const rule = fig.rules.find((r) => r.op === op && r.at === at);
  if (!rule) throw new Error(`No rule for ${op} at ${at}`);
  return rule;
}

/** True when the instruction moves the core: an exception to a higher level, or a return. */
export function moves(fig: ExceptionLevelsFigure, state: ElevatorState, op: ElOp): boolean {
  const rule = ruleFor(fig, op, state.at);
  return rule.result === 'up' || (rule.result === 'return' && state.pending.at(-1)?.level === state.at);
}

/** Runs `op` at the current level. Instructions that do not move the core leave the state as it was. */
export function run(
  fig: ExceptionLevelsFigure,
  state: ElevatorState,
  op: ElOp,
): { state: ElevatorState; outcome: ElOutcome } {
  const rule = ruleFor(fig, op, state.at);
  const from = state.at;
  if (rule.result === 'up' && rule.to) {
    return {
      state: { at: rule.to, pending: [...state.pending, { level: rule.to, back: from }] },
      outcome: { op, rule, from, to: rule.to },
    };
  }
  const top = state.pending.at(-1);
  if (rule.result === 'return' && top?.level === from) {
    return {
      state: { at: top.back, pending: state.pending.slice(0, -1) },
      outcome: { op, rule, from, to: top.back },
    };
  }
  return { state, outcome: { op, rule, from, to: from } };
}

const fill = (text: string, from: ElLevel, to: ElLevel) => text.replaceAll('{from}', from).replaceAll('{to}', to);

/** The short note next to an instruction: where it would take the core from here. */
export function opHint(fig: ExceptionLevelsFigure, state: ElevatorState, op: ElOp): string {
  const rule = ruleFor(fig, op, state.at);
  if (rule.result === 'up') return `to ${rule.to}`;
  if (rule.result === 'return') {
    const back = state.pending.at(-1)?.back;
    return back ? `back to ${back}` : 'nothing saved to return to';
  }
  if (rule.result === 'same') return `stays at ${state.at}`;
  return `undefined at ${state.at}`;
}

export function renderOps(fig: ExceptionLevelsFigure, state: ElevatorState): string {
  return fig.ops
    .map(({ op, label }) => {
      const on = moves(fig, state, op);
      return (
        `<div class="ea-elevator__op">` +
        `<button type="button" class="ea-btn ea-elevator__btn" data-op="${op}" aria-disabled="${!on}" aria-describedby="ea-el-hint-${op}">${esc(label)}</button>` +
        `<span class="ea-elevator__hint${on ? '' : ' is-off'}" id="ea-el-hint-${op}" data-hint="${op}"><span aria-hidden="true">${on ? '> ' : '* '}</span>${esc(opHint(fig, state, op))}</span></div>`
      );
    })
    .join('');
}

export function renderPosition(fig: ExceptionLevelsFigure, state: ElevatorState): string {
  const token =
    `<span class="ea-ladder__token" data-token="cpu">CPU` +
    `<span class="ea-ladder__token-level"> · ${state.at}</span></span>`;
  return renderLevelGrid('armv8-a', (level, world) => (level === state.at && fig.worlds[level] === world ? token : ''));
}

const TAG = {
  up: { word: 'TAKEN', cls: 'is-taken' },
  return: { word: 'ERET', cls: 'is-return' },
  same: { word: 'SAME', cls: 'is-same' },
  undefined: { word: 'UNDEF', cls: 'is-undef' },
} as const;

/** What just happened: a tagged headline and the reason, or the opening sentence. */
export function renderResult(fig: ExceptionLevelsFigure, outcome?: ElOutcome): string {
  if (!outcome) return `<p class="ea-elevator__why">${esc(fig.intro)}</p>`;
  const { rule, from, to } = outcome;
  const label = fig.ops.find((o) => o.op === outcome.op)?.label ?? outcome.op;
  const moved = from !== to;
  const kind = moved
    ? rule.result === 'return'
      ? 'return'
      : 'up'
    : rule.result === 'undefined'
      ? 'undefined'
      : 'same';
  const head =
    kind === 'undefined'
      ? `${label} at ${from}: undefined`
      : kind === 'same'
        ? `${label} at ${from}: stays at ${from}`
        : `${label}: ${from} → ${to}`;
  const why = [rule.result === 'return' && !moved ? 'There is no saved state to return with.' : rule.why];
  if (kind === 'up') why.push(fill(fig.entry.text, from, to));
  if (kind === 'return') why.push(fill(fig.eret.text, from, to));
  if (kind === 'undefined') why.push(fig.undefinedNote.text);
  if (moved && fig.worlds[from] !== fig.worlds[to]) why.push(fig.worldChange[fig.worlds[to]]);
  const tag = TAG[kind];
  return (
    `<p class="ea-elevator__head"><span class="ea-elevator__tag ${tag.cls}">[ ${tag.word} ]</span> ${esc(head)}</p>` +
    `<p class="ea-elevator__why">${esc(why.join(' '))}</p>`
  );
}

export function renderPending(state: ElevatorState): string {
  if (state.pending.length === 0) return `<li class="ea-elevator__empty">none: nothing to return to</li>`;
  return state.pending
    .map((p, k) => ({ p, top: k === state.pending.length - 1 }))
    .reverse()
    .map(
      ({ p, top }) =>
        `<li class="ea-elevator__frame${top ? ' is-top' : ''}" data-frame="${p.level}">` +
        `<span class="ea-elevator__mark" aria-hidden="true">${top ? '> ' : '  '}</span>` +
        `<code>ELR_${p.level}</code>, <code>SPSR_${p.level}</code>: back to ${p.back}` +
        (top ? '<span class="ea-elevator__next"> · next eret</span>' : '') +
        '</li>',
    )
    .join('');
}

function link(src: Source): string {
  const title = esc(src.title) + (src.section ? `, ${esc(src.section)}` : '');
  return src.url ? `<a href="${esc(src.url)}" rel="noopener">${title}</a>` : title;
}

/** Every source behind the rules, the register notes and the assumptions: one entry per document, sections merged. */
export function elevatorSources(fig: ExceptionLevelsFigure): Source[] {
  const all = [
    ...fig.rules.flatMap((r) => r.sources),
    ...fig.entry.sources,
    ...fig.eret.sources,
    ...fig.undefinedNote.sources,
    ...fig.worldChange.sources,
    ...fig.assumptions.sources,
  ];
  const docs = new Map<string, { source: Source; sections: Set<string> }>();
  for (const s of all) {
    const doc = docs.get(s.title) ?? { source: s, sections: new Set<string>() };
    for (const part of s.section?.split('; ') ?? []) doc.sections.add(part);
    docs.set(s.title, doc);
  }
  return [...docs.values()].map(({ source, sections }) => {
    const { section: _, ...rest } = source;
    return sections.size > 0 ? { ...rest, section: [...sections].join('; ') } : rest;
  });
}

export function renderSourceList(sources: Source[]): string {
  return sources.map(link).join('; ');
}
