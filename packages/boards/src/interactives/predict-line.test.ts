// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';
import { captureSpan, readCapture } from '../node.ts';
import { PredictQuestion, predictChoices, predictLine } from './predict-line.ts';

const capture = readCapture(predictLine.log);
const line = (n: number) => capture.lines[n - 1] ?? '';

/** The first non-blank line after line `n`. */
function nextNonBlank(n: number): number {
  let k = n + 1;
  while (k <= capture.lines.length && line(k).trim() === '') k += 1;
  return k;
}

describe('predictLine data', () => {
  it('asks for the next non-blank line after each context', () => {
    for (const q of predictLine.questions) {
      expect(q.answer.from, q.id).toBe(nextNonBlank(q.context.to));
    }
  });

  it('offers only real, distinct, non-blank lines from the same capture', () => {
    for (const q of predictLine.questions) {
      const texts = predictChoices(q).map((r) => captureSpan(r).join('\n'));
      expect(
        texts.every((t) => t.trim() !== ''),
        q.id,
      ).toBe(true);
      expect(new Set(texts).size, q.id).toBe(texts.length);
      expect(predictChoices(q)[q.answerAt]).toEqual(q.answer);
      expect(captureSpan(q.context).length).toBeGreaterThan(0);
    }
  });

  it('keeps the answer in different places', () => {
    expect(new Set(predictLine.questions.map((q) => q.answerAt)).size).toBeGreaterThan(1);
  });

  it('quotes the lines the explanations rely on', () => {
    expect(line(16)).toBe('NOTICE:  BL1: Booting BL31');
    expect(line(19)).toBe('Bloblist at 0 not found (err=-2)');
    expect(line(72)).toMatch(/^\[ {4}0\.000000\] Booting Linux on physical CPU/);
    expect(line(301)).toContain('readonly');
    expect(line(305)).toContain('re-mounted');
    expect(line(305)).toContain('r/w');
  });

  it('rejects a multi-line answer or a choice from another capture', () => {
    const q = predictLine.questions[0];
    expect(() => PredictQuestion.parse({ ...q, answer: { ...q?.answer, to: 15 } })).toThrow();
    expect(() =>
      PredictQuestion.parse({
        ...q,
        distractors: [{ log: 'qemu/m10-gdb-start-kernel.log', from: 10, to: 10 }, q?.answer],
      }),
    ).toThrow();
    expect(() => PredictQuestion.parse({ ...q, answerAt: 7 })).toThrow();
  });
});
