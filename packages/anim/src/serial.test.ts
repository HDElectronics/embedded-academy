// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT
// @vitest-environment happy-dom

import { getBoard } from '@ea/boards';
import { readBoardLog } from '@ea/boards/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clampPos, endOf, renderSerial, renderStrip, stageAt, toSerialLog } from './serial.ts';
import { defineSerialConsole, type EaSerialConsole } from './serial-console.ts';
import { toChainBoard } from './types.ts';

const log = toSerialLog(toChainBoard(getBoard('bbb'), readBoardLog(getBoard('bbb'))));
const uBoot = log.stages.indexOf('U-Boot');

describe('serial timeline', () => {
  it('tags every line with the stage that printed it', () => {
    expect(log.lines[0]?.stage).toBe(0);
    expect(log.lines.at(-1)?.stage).toBe(log.stages.length - 1);
  });

  it('keeps the position inside the log', () => {
    expect(clampPos(log, 0)).toBe(1);
    expect(clampPos(log, 999)).toBe(log.lines.length);
  });

  it('jumps to the last line a stage printed', () => {
    const pos = endOf(log, uBoot);
    expect(stageAt(log, pos)).toBe(uBoot);
    expect(stageAt(log, pos + 1)).toBeGreaterThan(uBoot);
  });

  it('marks the current stage on the strip and shows only lines up to the position', () => {
    const pos = endOf(log, uBoot);
    expect(renderStrip(log, pos).match(/aria-current="step"/g)).toHaveLength(1);
    expect(renderSerial(log, pos).match(/data-line=/g)).toHaveLength(pos);
  });
});

async function mount(reducedMotion = false): Promise<EaSerialConsole> {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({ matches: reducedMotion && query.includes('reduce'), media: query }) as MediaQueryList,
  );
  defineSerialConsole();
  const all = log.lines.length;
  document.body.innerHTML = `
    <ea-serial-console>
      <script type="application/json" data-log>${JSON.stringify(log)}</script>
      <ol data-part="strip">${renderStrip(log, all)}</ol>
      <span data-part="where"></span><input type="range" data-part="scrub" min="1" max="${all}" value="${all}">
      <div data-part="console">${renderSerial(log, all)}</div>
      <button data-part="prev">Previous line</button><button data-part="play">Replay log</button><button data-part="next">Next line</button>
    </ea-serial-console>`;
  await Promise.resolve();
  const el = document.querySelector('ea-serial-console');
  if (!el) throw new Error('not mounted');
  return el as EaSerialConsole;
}

const q = (s: string) => document.querySelector<HTMLElement>(s);

describe('<ea-serial-console>', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('starts with the whole log shown', async () => {
    const el = await mount();
    expect(el.pos).toBe(log.lines.length);
  });

  it('jumps to a stage from the strip and from a line it printed', async () => {
    const el = await mount();
    q(`[data-seek-stage="${uBoot}"]`)?.click();
    expect(el.stage).toBe(uBoot);
    expect(el.pos).toBe(endOf(log, uBoot));
    q('[data-line="0"]')?.click();
    expect(el.stage).toBe(0);
  });

  it('follows the scrubber', async () => {
    const el = await mount();
    const scrub = q('[data-part="scrub"]') as HTMLInputElement;
    scrub.value = '2';
    scrub.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.pos).toBe(2);
    expect(q('[data-part="where"]')?.textContent).toBe(`line 2/${log.lines.length}`);
  });

  it('replays from the first line to the end', async () => {
    vi.useFakeTimers();
    const el = await mount();
    q('[data-part="play"]')?.click();
    expect(el.playing).toBe(true);
    vi.runAllTimers();
    expect(el.pos).toBe(log.lines.length);
    expect(el.playing).toBe(false);
    expect(q('[data-part="play"]')?.textContent).toBe('Replay log');
  });

  it('steps one line at a time with reduced motion', async () => {
    const el = await mount(true);
    expect(q('[data-part="play"]')?.textContent).toBe('Next line');
    q('[data-part="play"]')?.click();
    expect(el.pos).toBe(1);
    expect(el.playing).toBe(false);
    expect(q('.is-typing')).toBeNull();
  });
});
