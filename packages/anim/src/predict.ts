// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// The next-line quiz: state and HTML. Rendered the same on the server and in the browser.

import { type CaptureRef, type PredictLineData, predictChoices, type Source } from '@ea/boards';
import { esc } from './render.ts';

export interface PredictView {
  log: string;
  questions: {
    id: string;
    context: string[];
    /** Line numbers of the choices, in display order. */
    lines: number[];
    choices: string[];
    answer: number;
    why: string;
    sources: Source[];
  }[];
}

/** Resolves every span with `read` (captureSpan at build time). */
export function resolvePredict(data: PredictLineData, read: (ref: CaptureRef) => string[]): PredictView {
  return {
    log: data.log,
    questions: data.questions.map((q) => {
      const choices = predictChoices(q);
      return {
        id: q.id,
        context: read(q.context),
        lines: choices.map((r) => r.from),
        choices: choices.map((r) => read(r).join('\n')),
        answer: q.answerAt,
        why: q.why,
        sources: q.sources,
      };
    }),
  };
}

export interface PredictState {
  q: number;
  /** The choice picked for question `q`, if any. */
  picked: number | null;
  score: number;
  /** Every question has been answered or skipped. */
  done: boolean;
}

export const PREDICT_START: PredictState = { q: 0, picked: null, score: 0, done: false };

/** Picks choice `i`. Only the first pick on a question counts. */
export function pickChoice(view: PredictView, s: PredictState, i: number): PredictState {
  const q = view.questions[s.q];
  if (!q || s.done || s.picked !== null || i < 0 || i >= q.choices.length) return s;
  return { ...s, picked: i, score: s.score + (i === q.answer ? 1 : 0) };
}

/** Goes to the next question, skipping this one if nothing was picked; from the end, starts again. */
export function advance(view: PredictView, s: PredictState): PredictState {
  if (s.done) return PREDICT_START;
  if (s.q >= view.questions.length - 1) return { ...s, picked: null, done: true };
  return { ...s, q: s.q + 1, picked: null };
}

export function advanceLabel(view: PredictView, s: PredictState): string {
  if (s.done) return 'Start again';
  if (s.picked === null) return 'Skip';
  return s.q >= view.questions.length - 1 ? 'See your score' : 'Next question';
}

/** Moves focus between choices: arrows wrap, Home and End jump. */
export function choiceKeyTarget(key: string, index: number, count: number): number | undefined {
  if (key === 'ArrowDown' || key === 'ArrowRight') return (index + 1) % count;
  if (key === 'ArrowUp' || key === 'ArrowLeft') return (index - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return undefined;
}

type Mark = 'open' | 'right' | 'wrong' | 'other';

const TAG: Record<Mark, string> = { open: '[  ?   ]', right: '[  OK  ]', wrong: '[FAILED]', other: '[      ]' };

export function choiceMark(view: PredictView, s: PredictState, i: number): Mark {
  const q = view.questions[s.q];
  if (!q || s.picked === null) return 'open';
  if (i === q.answer) return 'right';
  return i === s.picked ? 'wrong' : 'other';
}

const TIMESTAMP = /^(\[\s*\d+\.\d+\])(.*)$/;

function lineHtml(line: string): string {
  const m = TIMESTAMP.exec(line);
  return m ? `<span class="ts">${esc(m[1] ?? '')}</span>${esc(m[2] ?? '')}` : esc(line);
}

/** The console so far, then either a cursor or the line that came next. */
export function renderPredictConsole(view: PredictView, s: PredictState): string {
  const q = view.questions[s.q];
  if (!q || s.done) return '';
  const lines = q.context.map((l) => `<div class="ea-console__line">${lineHtml(l)}</div>`).join('');
  const next =
    s.picked === null
      ? '<div class="ea-console__line"><span class="ea-console__cursor" aria-hidden="true"></span></div>'
      : `<div class="ea-console__line ea-predict__next"><span class="visually-hidden">Next line: </span>${lineHtml(q.choices[q.answer] ?? '')}</div>`;
  return lines + next;
}

export function renderPredictChoices(view: PredictView, s: PredictState, focus = 0): string {
  const q = view.questions[s.q];
  if (!q || s.done) return '';
  return q.choices
    .map((text, i) => {
      const mark = choiceMark(view, s, i);
      return (
        `<button type="button" class="ea-predict__choice is-${mark}" data-choice="${i}" ` +
        `aria-pressed="${s.picked === i}"${s.picked === null ? '' : ' aria-disabled="true"'} tabindex="${i === focus ? 0 : -1}">` +
        `<span class="ea-predict__tag">${TAG[mark]}</span><span class="ea-predict__text">${lineHtml(text)}</span></button>`
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

/** The verdict and the reason, or the final score. */
export function renderPredictResult(view: PredictView, s: PredictState): string {
  const total = view.questions.length;
  if (s.done) return `<p class="ea-predict__verdict">You scored ${s.score} of ${total}.</p>`;
  const q = view.questions[s.q];
  if (!q) return '';
  if (s.picked === null) return '<p class="ea-predict__hint">Pick the line you expect.</p>';
  const right = s.picked === q.answer;
  const file = view.log.split('/').pop() ?? view.log;
  return (
    `<p class="ea-predict__verdict"><span class="ea-stage__state ea-stage__state--${right ? 'ok' : 'fail'}">${right ? '[  OK  ]' : '[FAILED]'}</span> ` +
    `${right ? 'Right.' : 'Not this one.'} Line ${q.lines[q.answer]} of ${esc(file)} comes next.</p>` +
    `<p class="ea-predict__why">${esc(q.why)}</p>` +
    `<p class="ea-chain__sources t-small">Source: ${renderSources(q.sources)}</p>`
  );
}

export function renderPredictMeta(view: PredictView, s: PredictState): string {
  const total = view.questions.length;
  return s.done ? `done · score ${s.score}/${total}` : `question ${s.q + 1}/${total} · score ${s.score}/${total}`;
}
