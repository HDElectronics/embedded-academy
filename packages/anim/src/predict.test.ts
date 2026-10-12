// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT
// @vitest-environment happy-dom

import { predictLine } from '@ea/boards';
import { captureSpan } from '@ea/boards/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  advance,
  advanceLabel,
  choiceKeyTarget,
  PREDICT_START,
  type PredictView,
  pickChoice,
  renderPredictChoices,
  renderPredictConsole,
  renderPredictMeta,
  renderPredictResult,
  resolvePredict,
} from './predict.ts';
import { definePredictLine, type EaPredictLine } from './predict-line.ts';

const view = resolvePredict(predictLine, (ref) => captureSpan(ref));
const first = view.questions[0];
const answer = first?.answer ?? 0;
const wrong = answer === 0 ? 1 : 0;

describe('resolvePredict', () => {
  it('puts the answer where the data says, with its line number', () => {
    expect(first?.choices[answer]).toBe('NOTICE:  BL2: v2.14.10(release):lts-v2.14.10');
    expect(first?.lines[answer]).toBe(14);
    expect(first?.context.at(-1)).toBe('NOTICE:  BL1: Booting BL2');
  });
});

describe('quiz state', () => {
  it('scores the first pick only', () => {
    const s = pickChoice(view, PREDICT_START, answer);
    expect(s).toMatchObject({ picked: answer, score: 1 });
    expect(pickChoice(view, s, wrong)).toBe(s);
    expect(pickChoice(view, PREDICT_START, wrong).score).toBe(0);
    expect(pickChoice(view, PREDICT_START, 9)).toBe(PREDICT_START);
  });

  it('skips, finishes and starts again', () => {
    let s = PREDICT_START;
    expect(advanceLabel(view, s)).toBe('Skip');
    s = pickChoice(view, s, answer);
    expect(advanceLabel(view, s)).toBe('Next question');
    for (let k = 0; k < view.questions.length - 1; k += 1) s = advance(view, s);
    expect(s.q).toBe(view.questions.length - 1);
    s = pickChoice(view, s, view.questions[s.q]?.answer ?? 0);
    expect(advanceLabel(view, s)).toBe('See your score');
    s = advance(view, s);
    expect(s).toMatchObject({ done: true, score: 2 });
    expect(renderPredictResult(view, s)).toContain('You scored 2 of 5.');
    expect(advanceLabel(view, s)).toBe('Start again');
    expect(advance(view, s)).toEqual(PREDICT_START);
  });
});

describe('rendering', () => {
  it('shows a cursor until you pick, then the real next line', () => {
    expect(renderPredictConsole(view, PREDICT_START)).toContain('ea-console__cursor');
    const html = renderPredictConsole(view, pickChoice(view, PREDICT_START, wrong));
    expect(html).toContain('Next line: </span>NOTICE:  BL2:');
  });

  it('marks the right and the wrong choice with words', () => {
    const s = pickChoice(view, PREDICT_START, wrong);
    const html = renderPredictChoices(view, s);
    expect(html).toContain('[  OK  ]');
    expect(html).toContain('[FAILED]');
    expect(html).toContain('aria-disabled="true"');
    expect(renderPredictResult(view, s)).toContain('Not this one. Line 14 of m10-chain-virt.log comes next.');
    expect(renderPredictResult(view, pickChoice(view, PREDICT_START, answer))).toContain('Right.');
    expect(renderPredictMeta(view, s)).toBe('question 1/5 · score 0/5');
  });
});

describe('choiceKeyTarget', () => {
  it('wraps with the arrows and jumps with Home and End', () => {
    expect(choiceKeyTarget('ArrowDown', 2, 3)).toBe(0);
    expect(choiceKeyTarget('ArrowUp', 0, 3)).toBe(2);
    expect(choiceKeyTarget('ArrowRight', 0, 3)).toBe(1);
    expect(choiceKeyTarget('End', 0, 3)).toBe(2);
    expect(choiceKeyTarget('Home', 2, 3)).toBe(0);
    expect(choiceKeyTarget('Enter', 0, 3)).toBeUndefined();
  });
});

async function mount(data: PredictView, reducedMotion = false): Promise<EaPredictLine> {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({ matches: reducedMotion && query.includes('reduce'), media: query }) as MediaQueryList,
  );
  definePredictLine();
  document.body.innerHTML = `
    <ea-predict-line>
      <script type="application/json" data-predict>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
      <span data-part="meta">${renderPredictMeta(data, PREDICT_START)}</span>
      <div data-part="console">${renderPredictConsole(data, PREDICT_START)}</div>
      <div data-part="choices">${renderPredictChoices(data, PREDICT_START)}</div>
      <div data-part="result" aria-live="polite">${renderPredictResult(data, PREDICT_START)}</div>
      <button data-part="advance">${advanceLabel(data, PREDICT_START)}</button>
    </ea-predict-line>`;
  await Promise.resolve();
  const el = document.querySelector('ea-predict-line');
  if (!el) throw new Error('not mounted');
  return el as EaPredictLine;
}

describe('<ea-predict-line>', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  const part = (name: string) => document.querySelector<HTMLElement>(`[data-part="${name}"]`);
  const choice = (i: number) => document.querySelector<HTMLElement>(`[data-choice="${i}"]`);
  const key = (k: string) =>
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

  it('moves with the arrows, picks with Enter, and keeps the score', async () => {
    vi.useFakeTimers();
    const el = await mount(view);
    choice(0)?.focus();
    for (let k = 0; k < answer; k += 1) key('ArrowDown');
    expect(document.activeElement?.getAttribute('data-choice')).toBe(String(answer));
    // Enter on a focused button clicks it.
    (document.activeElement as HTMLElement).click();
    vi.runAllTimers();
    expect(el.state).toMatchObject({ picked: answer, score: 1 });
    expect(part('result')?.textContent).toContain('Right.');
    expect(part('meta')?.textContent).toBe('question 1/5 · score 1/5');
    expect(document.activeElement?.getAttribute('data-choice')).toBe(String(answer));
  });

  it('skips to the next question and moves focus to its first choice', async () => {
    const el = await mount(view);
    part('advance')?.focus();
    part('advance')?.click();
    expect(el.state.q).toBe(1);
    expect(el.state.score).toBe(0);
    expect(document.activeElement?.getAttribute('data-choice')).toBe('0');
    expect(part('console')?.textContent).toContain('NOTICE:  BL2: Built');
  });

  it('shows the score at the end and starts again', async () => {
    const el = await mount(view);
    for (let k = 0; k < view.questions.length; k += 1) part('advance')?.click();
    expect(el.state.done).toBe(true);
    expect(part('choices')?.hidden).toBe(true);
    expect(part('result')?.textContent).toBe('You scored 0 of 5.');
    expect(part('advance')?.textContent).toBe('Start again');
    part('advance')?.click();
    expect(el.state).toEqual(PREDICT_START);
  });

  it('shows the next line at once with reduced motion', async () => {
    await mount(view, true);
    choice(wrong)?.click();
    expect(document.querySelector('.ea-predict__next')?.getAttribute('style')).toBeNull();
    part('advance')?.click();
    expect(part('choices')?.getAttribute('style')).toBeNull();
  });
});
