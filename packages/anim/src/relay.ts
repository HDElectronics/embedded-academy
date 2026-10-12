// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// The hand-off relay: state and HTML. Rendered the same on the server and in the browser.

import { type CaptureRef, formatAddress, type HandoffRelayData, type RelayStep, type Source } from '@ea/boards';
import type { StageState } from './model.ts';
import { esc } from './render.ts';

/** A captured span with its lines resolved. */
export interface RelaySpan {
  log: string;
  from: number;
  to: number;
  lines: string[];
}

export interface RelayView {
  steps: {
    id: string;
    name: string;
    level: RelayStep['level'];
    world: RelayStep['world'];
    console: RelaySpan[];
    loads: { image: string; at: number; end?: number; size?: number; log: string; line: number }[];
    handoff: { summary: string; span: RelaySpan; note?: string };
    explain: string;
    sources: Source[];
  }[];
}

/** Resolves every span with `read` (captureSpan at build time). */
export function resolveRelay(data: HandoffRelayData, read: (ref: CaptureRef) => string[]): RelayView {
  const span = (ref: CaptureRef): RelaySpan => ({ ...ref, lines: read(ref) });
  return {
    steps: data.steps.map((s) => ({
      id: s.id,
      name: s.name,
      level: s.level,
      world: s.world,
      console: s.console.map(span),
      loads: s.loads.map((l) => ({
        image: l.image,
        at: l.at,
        ...(l.end === undefined ? {} : { end: l.end }),
        ...(l.size === undefined ? {} : { size: l.size }),
        log: l.ref.log,
        line: l.ref.from,
      })),
      handoff: {
        summary: s.handoff.summary,
        span: span(s.handoff.ref),
        ...(s.handoff.note === undefined ? {} : { note: s.handoff.note }),
      },
      explain: s.explain,
      sources: s.sources,
    })),
  };
}

export function clampStep(view: RelayView, index: number): number {
  return Math.max(0, Math.min(view.steps.length - 1, Math.trunc(index) || 0));
}

export interface RelayState {
  index: number;
  stages: { name: string; level: string; world: string; state: StageState }[];
  /** Images loaded up to and including this step; `isNew` for this step's own. */
  loaded: { image: string; range: string; by: string; where: string; isNew: boolean }[];
}

export function relayState(view: RelayView, index: number): RelayState {
  const i = clampStep(view, index);
  return {
    index: i,
    stages: view.steps.map((s, k) => ({
      name: s.name,
      level: s.level,
      world: s.world,
      state: k < i ? 'ok' : k === i ? 'run' : 'wait',
    })),
    loaded: view.steps.slice(0, i + 1).flatMap((s, k) =>
      s.loads.map((l) => ({
        image: l.image,
        range:
          formatAddress(l.at) +
          (l.end !== undefined ? ` to ${formatAddress(l.end)}` : '') +
          (l.size !== undefined ? `, size ${formatAddress(l.size)}` : ''),
        by: s.name,
        where: `${fileName(l.log)}:${l.line}`,
        isNew: k === i,
      })),
    ),
  };
}

const STATE: Record<StageState, string> = { ok: '[  OK  ]', run: '[ RUN  ]', wait: '[ WAIT ]' };

const fileName = (log: string) => log.split('/').pop() ?? log;

export function renderRelayStages(state: RelayState): string {
  return state.stages
    .map((s, k) => {
      const current = k === state.index;
      return (
        `<li><button type="button" class="ea-relay__stage${current ? ' is-current' : ''}" data-step="${k}" ` +
        `aria-pressed="${current}" tabindex="${current ? 0 : -1}">` +
        `<span class="ea-stage__state ea-stage__state--${s.state}">${STATE[s.state]}</span>` +
        `<span class="ea-relay__name">${esc(s.name)}</span>` +
        `<span class="ea-tag ea-tag--${s.world}">${esc(s.level)} · ${esc(s.world)}</span></button></li>`
      );
    })
    .join('');
}

const TIMESTAMP = /^(\[\s*\d+\.\d+\])(.*)$/;

function renderLines(lines: string[]): string {
  return lines
    .map((line) => {
      const m = TIMESTAMP.exec(line);
      const html = m ? `<span class="ts">${esc(m[1] ?? '')}</span>${esc(m[2] ?? '')}` : esc(line);
      return `<div class="ea-console__line">${html}</div>`;
    })
    .join('');
}

/** Console output of every step up to `index`, one group per step. */
export function renderRelayConsole(view: RelayView, index: number): string {
  const i = clampStep(view, index);
  return view.steps
    .slice(0, i + 1)
    .map((s, k) => {
      const current = k === i;
      const spans = s.console
        .map((sp, n) => {
          const prev = s.console[n - 1];
          const gap =
            prev && prev.log === sp.log && sp.from > prev.to + 1
              ? `<p class="ea-relay__gap">[ lines ${prev.to + 1} to ${sp.from - 1} not shown ]</p>`
              : '';
          return gap + renderLines(sp.lines);
        })
        .join('');
      const first = s.console[0];
      const last = s.console[s.console.length - 1];
      const where = first && last ? `${fileName(first.log)}:${first.from}-${last.to}` : '';
      return (
        `<div class="ea-relay__group${current ? ' is-current' : ''}" data-group="${k}">` +
        `<p class="ea-relay__src">${current ? '&gt; ' : ''}${esc(s.name)} · ${esc(where)}</p>${spans}</div>`
      );
    })
    .join('');
}

function renderSources(sources: Source[]): string {
  return sources
    .map((src) => {
      const title = esc(src.title) + (src.section ? `, ${esc(src.section)}` : '');
      return src.url ? `<a href="${esc(src.url)}" rel="noopener">${title}</a>` : title;
    })
    .join('; ');
}

/** The hand-off and the images in memory at step `index`. */
export function renderRelayDetail(view: RelayView, index: number): string {
  const state = relayState(view, index);
  const step = view.steps[state.index];
  if (!step) return '';
  const next = view.steps[state.index + 1];
  const h = step.handoff;
  const loads = state.loaded.length
    ? `<ul class="ea-relay__loads">${state.loaded
        .map(
          (l) =>
            `<li class="ea-relay__load${l.isNew ? ' is-new' : ''}"><span class="ea-relay__image">${l.isNew ? '* ' : ''}${esc(l.image)}</span>` +
            `<span class="ea-relay__range">${esc(l.range)}</span>` +
            `<span class="ea-relay__by">by ${esc(l.by)} · ${esc(l.where)}${l.isNew ? ' · new' : ''}</span></li>`,
        )
        .join('')}</ul>`
    : '<p class="ea-relay__none">Nothing loaded yet.</p>';
  return (
    `<div class="ea-relay__box" data-part="handoff">` +
    `<p class="ea-pane__label">${next ? `${esc(step.name)} hands over to ${esc(next.name)}` : `${esc(step.name)} hands over to you`}</p>` +
    `<p class="ea-relay__summary">${esc(h.summary)}</p>` +
    `<div class="ea-console ea-relay__lines">${renderLines(h.span.lines)}</div>` +
    `<p class="ea-relay__src">${esc(fileName(h.span.log))}:${h.span.from}-${h.span.to}</p>` +
    (h.note ? `<p class="ea-relay__note">* ${esc(h.note)}</p>` : '') +
    `<p class="ea-relay__explain">${esc(step.explain)}</p>` +
    `<p class="ea-chain__sources t-small">Sources: ${renderSources(step.sources)}</p></div>` +
    `<div class="ea-relay__box"><p class="ea-pane__label">Loaded so far</p>${loads}</div>`
  );
}

export function relayStatus(view: RelayView, index: number): string {
  const i = clampStep(view, index);
  const step = view.steps[i];
  return step ? `Stage ${i + 1} of ${view.steps.length}: ${step.name}. ${step.handoff.summary}.` : '';
}
