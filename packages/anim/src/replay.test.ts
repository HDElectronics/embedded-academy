// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT
// @vitest-environment happy-dom

import type { ReplayScenario } from '@ea/boards';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountReplayForTest, part, radio } from './replay.test-helpers.ts';
import {
  captureVerification,
  choiceKey,
  gapNote,
  outcomeLabel,
  outcomeTone,
  type ReplayChoice,
  type ReplayData,
  readSpans,
  renderChoices,
  renderInline,
  renderOutcome,
  replayStatus,
  spanWhere,
  toReplayChoice,
} from './replay.ts';

// A fake capture: line n reads `line n`.
const read = (ref: { from: number; to: number }) =>
  Array.from({ length: ref.to - ref.from + 1 }, (_, k) => `line ${ref.from + k}`);

const scenario = (id: string, tag: ReplayScenario['outcome']['tag'], from: number): ReplayScenario => ({
  id,
  title: `Choice ${id}`,
  detail: 'detail',
  console: [{ log: 'qemu/demo.log', from, to: from + 1 }],
  outcome: { tag, text: `outcome ${id}` },
  explain: 'Because `x` is so.',
  sources: [{ title: 'A source', url: 'https://example.org/' }],
});

const data: ReplayData = {
  choices: [scenario('a', 'OK', 10), scenario('b', 'FAILED', 20), scenario('c', 'SILENT', 30)].map((s) =>
    toReplayChoice(s, read),
  ),
};

function pick(k: number): ReplayChoice {
  const c = data.choices[k];
  if (!c) throw new Error(`no choice ${k}`);
  return c;
}

describe('replay helpers', () => {
  it('reads spans in order and notes the lines left out between them', () => {
    const spans = [
      { log: 'qemu/demo.log', from: 3, to: 4 },
      { log: 'qemu/demo.log', from: 5, to: 5 },
      { log: 'qemu/demo.log', from: 9, to: 9 },
    ];
    expect(readSpans(spans, read)).toEqual(['line 3', 'line 4', 'line 5', gapNote(3), 'line 9']);
    expect(gapNote(1)).toBe('(… 1 line not shown)');
    expect(spanWhere(spans)).toBe('logs/qemu/demo.log, lines 3–4, 5, 9');
    expect(spanWhere([{ log: 'qemu/demo.log', from: 7, to: 7 }])).toBe('logs/qemu/demo.log, line 7');
  });

  it('writes outcomes as fixed-width bracketed words with a tone', () => {
    expect(outcomeLabel('OK')).toBe('[  OK  ]');
    expect(outcomeLabel('FAILED')).toBe('[FAILED]');
    expect(outcomeLabel('WAIT')).toBe('[ WAIT ]');
    expect(outcomeTone('OK')).toBe('ok');
    expect(outcomeTone('FAILED')).toBe('fail');
    expect(outcomeTone('SILENT')).toBe('warn');
  });

  it('moves through the choices with arrow keys, Home and End, wrapping around', () => {
    expect(choiceKey('ArrowDown', 0, 3)).toBe(1);
    expect(choiceKey('ArrowRight', 2, 3)).toBe(0);
    expect(choiceKey('ArrowUp', 0, 3)).toBe(2);
    expect(choiceKey('ArrowLeft', 1, 3)).toBe(0);
    expect(choiceKey('Home', 2, 3)).toBe(0);
    expect(choiceKey('End', 0, 3)).toBe(2);
    expect(choiceKey('a', 0, 3)).toBeUndefined();
    expect(choiceKey('ArrowDown', 0, 0)).toBeUndefined();
  });

  it('renders a radio group with one checked, focusable choice and a marker', () => {
    const html = renderChoices(data.choices, 1);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
    expect(html).toContain('(*)</span> Choice b');
  });

  it('pairs the outcome colour with a word, and cites the sources', () => {
    const html = renderOutcome(pick(1));
    expect(html).toContain('<span class="ea-replay__tag is-fail">[FAILED]</span> outcome b');
    expect(html).toContain('<a href="https://example.org/" rel="noopener">A source</a>');
    expect(renderInline('a `<b>` c')).toBe('a <code>&#60;b&#62;</code> c');
  });

  it('labels a figure with the weakest verification level of its captures', () => {
    const headers: Record<string, string> = { 'qemu/a.log': 'emulated', 'qemu/b.log': 'emulated' };
    const reader = (log: string) => ({ header: { verification: [headers[log] ?? 'bogus'] } });
    expect(captureVerification(['qemu/a.log', 'qemu/b.log'], reader)).toBe('verified in QEMU');
    expect(captureVerification(['qemu/a.log', 'qemu/x.log'], reader)).toBe('not yet verified');
  });
});

describe('<ea-replay-test>', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  const scene = (d: ReplayData, i: number) => `<span data-token="x">${d.choices[i]?.id}</span>`;

  it('picks a choice on click, then types its console to the end', async () => {
    vi.useFakeTimers();
    const el = await mountReplayForTest('ea-replay-test', data, scene);
    radio(1).click();
    expect(el.index).toBe(1);
    expect(radio(1).getAttribute('aria-checked')).toBe('true');
    expect(radio(0).getAttribute('aria-checked')).toBe('false');
    expect(part('scene').textContent).toBe('b');
    expect(part('where').textContent).toBe('logs/qemu/demo.log, lines 20–21');
    expect(part('outcome').textContent).toContain('[FAILED] outcome b');
    expect(part('status').textContent).toBe(replayStatus(pick(1)));
    vi.runAllTimers();
    expect(part('console').textContent).toContain('line 20line 21');
    expect(part('console').querySelector('.ea-console__cursor')).not.toBeNull();
  });

  it('moves the checked choice and focus with the arrow keys', async () => {
    const el = await mountReplayForTest('ea-replay-test', data, scene, { start: 2 });
    expect(el.index).toBe(2);
    radio(2).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(el.index).toBe(0);
    expect(document.activeElement).toBe(radio(0));
    radio(0).dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(el.index).toBe(2);
    radio(2).dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
    expect(el.index).toBe(2);
  });

  it('replays the console with the primary button', async () => {
    vi.useFakeTimers();
    await mountReplayForTest('ea-replay-test', data, scene);
    part('play').click();
    expect(part('console').textContent).not.toContain('line 11');
    vi.runAllTimers();
    expect(part('console').textContent).toContain('line 10line 11');
  });

  it('switches instantly with reduced motion, and turns Replay into Next', async () => {
    const el = await mountReplayForTest('ea-replay-test', data, scene, { reducedMotion: true });
    expect(part('play').textContent).toBe('Next choice');
    part('play').click();
    expect(el.index).toBe(1);
    expect(part('console').textContent).toContain('line 20line 21');
    radio(2).click();
    expect(part('console').textContent).toContain('line 30line 31');
  });
});
