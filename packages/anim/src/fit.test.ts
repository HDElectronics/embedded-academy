// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT
// @vitest-environment happy-dom

import { splFit as fig, getBoard, SplFitFigure } from '@ea/boards';
import { captureSpan, readCapture } from '@ea/boards/node';
import { animate } from 'animejs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addBytes,
  type FitState,
  fitMargin,
  fitStart,
  imageBlocks,
  renderBudget,
  renderFitControls,
  renderFitImage,
  renderFitResult,
  renderZoom,
  splFits,
  splSize,
  stepLabel,
  undoFit,
  zoomShare,
} from './fit.ts';
import { defineSplFit, type EaSplFit } from './spl-fit.ts';

vi.mock('animejs', () => ({ animate: vi.fn(), stagger: vi.fn() }));

const evidence = (m: { evidence: Parameters<typeof captureSpan>[0] }) => captureSpan(m.evidence).join('\n');
const adds = (steps: number[], from: FitState = fitStart()) => steps.reduce((s, n) => addBytes(fig, s, n), from);

describe('splFit data', () => {
  it('parses against its schema', () => {
    expect(SplFitFigure.parse(fig)).toEqual(fig);
  });

  it('takes every size from the m04 capture', () => {
    expect(evidence(fig.limitA)).toContain(`\n${fig.limitA.bytes}\n`);
    expect(evidence(fig.limitA)).toContain('$ echo $((0x4030B800 - 0x402F0400))');
    expect(evidence(fig.limitB)).toContain(fig.limitB.config);
    expect(evidence(fig.limitB)).toMatch(new RegExp(`\\n${fig.limitB.bytes}$`));
    expect(evidence(fig.spl)).toContain(` ${fig.spl.bytes} `);
    expect(evidence(fig.spl)).toContain(fig.spl.label);
    expect(evidence(fig.image)).toContain(` ${fig.image.bytes} `);
    expect(evidence(fig.image)).toContain(fig.image.label);
  });

  it('names the build the capture header states', () => {
    const { header } = readCapture(fig.spl.evidence.log);
    expect(header.board?.join()).toContain(fig.build.defconfig);
    expect(header.software?.join()).toContain(fig.build.version);
  });

  it('places the download area where the board data starts SRAM', () => {
    const sram = getBoard('bbb').regions.find((r) => r.id === 'sram');
    const base = `0x${sram?.base?.toString(16).toUpperCase()}`;
    expect(evidence(fig.limitA)).toContain(`- ${base}`);
  });

  it('never claims a link failure the linker would not report', () => {
    // The linker checks code and data (text + data from `size`), not the file.
    // Every reachable size must give the same verdict on both measures.
    const [, sizes] = captureSpan({ log: fig.spl.evidence.log, from: 28, to: 29 });
    const [text, data] = (sizes ?? '').trim().split(/\s+/).map(Number);
    const sections = (text ?? 0) + (data ?? 0);
    for (let added = 0; added <= 2 * 1024; added += Math.min(...fig.steps)) {
      expect(fig.spl.bytes + added > fig.limitB.bytes).toBe(sections + added > fig.limitB.bytes);
    }
  });
});

describe('fit logic', () => {
  it('starts as the lab measured it, inside limit B', () => {
    expect(splSize(fig, fitStart())).toBe(fig.spl.bytes);
    expect(fitMargin(fig, fitStart())).toBe(fig.limitB.bytes - fig.spl.bytes);
    expect(splFits(fig, fitStart())).toBe(true);
  });

  it('fails the link once SPL passes limit B, then stops adding', () => {
    const over = adds([64, 64, 64]);
    expect(splFits(fig, over)).toBe(false);
    expect(fitMargin(fig, over)).toBe(fig.limitB.bytes - fig.spl.bytes - 192);
    expect(addBytes(fig, over, 1024)).toBe(over);
    expect(renderFitResult(fig, over)).toContain('[FAILED]');
    expect(renderFitControls(fig, over)).toContain('data-add="64" aria-disabled="true"');
  });

  it('undoes one step at a time, back to the measured size', () => {
    const s = adds([64, 64]);
    expect(undoFit(s).added).toEqual([64]);
    expect(undoFit(undoFit(s))).toEqual(fitStart());
    expect(undoFit(fitStart())).toEqual(fitStart());
  });

  it('never grows SPL past limit A', () => {
    const near = adds([64, 64]);
    expect(splFits(fig, near)).toBe(true);
    expect(splSize(fig, adds([1024], near))).toBeLessThanOrEqual(fig.limitA.bytes);
  });

  it('puts limit B in the middle of the zoom and limit A at its edge', () => {
    expect(zoomShare(fig, fig.limitB.bytes)).toBe('50.000%');
    expect(zoomShare(fig, fig.limitA.bytes)).toBe('100.000%');
    expect(zoomShare(fig, 0)).toBe('0.000%');
  });

  it('labels steps in bytes or KiB', () => {
    expect(fig.steps.map(stepLabel)).toEqual(['+64 bytes', '+256 bytes', '+1 KiB']);
  });
});

describe('rendering', () => {
  it('shows the margin as built, and as an overflow once past limit B', () => {
    const m = fig.limitB.bytes - fig.spl.bytes;
    expect(renderFitResult(fig, fitStart())).toContain(`[  OK  ]</span> fits under limit B, ${m} bytes to spare`);
    expect(renderZoom(fig, fitStart())).toContain(`${m} bytes to spare`);
    expect(renderZoom(fig, adds([1024]))).toContain(`${1024 - m} bytes past limit B`);
  });

  it('draws the limits and SPL to scale, with their captured sizes', () => {
    const html = renderBudget(fig, fitStart());
    for (const n of [fig.limitA.bytes, fig.limitB.bytes, fig.spl.bytes]) expect(html).toContain(`${n} bytes`);
    expect(html).toContain('data-fill="a" style="width: 100.000%"');
  });

  it('lays u-boot.img out in blocks the size of the area', () => {
    const html = renderFitImage(fig);
    expect(imageBlocks(fig)).toBe(Math.ceil(fig.image.bytes / fig.limitA.bytes));
    expect(html.match(/class="ea-fit__block[ "]/g)).toHaveLength(imageBlocks(fig));
    expect(html).toContain(`${fig.image.bytes} bytes`);
  });
});

describe('<ea-spl-fit>', () => {
  const mount = async (reducedMotion: boolean) => {
    vi.stubGlobal(
      'matchMedia',
      (query: string) => ({ matches: reducedMotion && query.includes('reduce'), media: query }) as MediaQueryList,
    );
    defineSplFit();
    const s = fitStart();
    document.body.innerHTML = `
      <ea-spl-fit>
        <script type="application/json" data-fit>${JSON.stringify(fig)}</script>
        <div data-part="budget">${renderBudget(fig, s)}</div>
        <div data-part="zoom">${renderZoom(fig, s)}</div>
        <div data-part="controls">${renderFitControls(fig, s)}</div>
        <div data-part="result">${renderFitResult(fig, s)}</div>
        <p data-part="note"></p>
      </ea-spl-fit>`;
    await Promise.resolve();
    const el = document.querySelector('ea-spl-fit');
    if (!el) throw new Error('not mounted');
    return el as EaSplFit;
  };
  const button = (sel: string) => document.querySelector<HTMLElement>(sel);
  const text = (part: string) => button(`[data-part="${part}"]`)?.textContent ?? '';

  beforeEach(() => vi.mocked(animate).mockClear());
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('adds bytes until the link fails, then explains why it stops', async () => {
    const el = await mount(false);
    button('[data-add="64"]')?.click();
    expect(el.state.added).toEqual([64]);
    expect(document.activeElement).toBe(button('[data-add="64"]'));
    button('[data-add="1024"]')?.click();
    expect(text('result')).toContain('[FAILED]');
    button('[data-add="256"]')?.click();
    expect(el.state.added).toEqual([64, 1024]);
    expect(text('note')).toContain('The link already fails');
  });

  it('undoes and resets', async () => {
    const el = await mount(false);
    button('[data-part="undo"]')?.click();
    expect(text('note')).toContain('Nothing to undo');
    button('[data-add="64"]')?.click();
    button('[data-add="64"]')?.click();
    button('[data-part="undo"]')?.click();
    expect(el.state.added).toEqual([64]);
    expect(text('note')).toBe('');
    button('[data-part="reset"]')?.click();
    expect(el.state).toEqual(fitStart());
    expect(text('result')).toContain('As built');
  });

  it('moves focus between the controls with the arrow keys', async () => {
    await mount(false);
    button('[data-add="64"]')?.focus();
    button('[data-add="64"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(button('[data-part="reset"]'));
    button('[data-part="reset"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(button('[data-add="64"]'));
  });

  it('grows the bar over 150 ms, and instantly with reduced motion', async () => {
    await mount(false);
    button('[data-add="1024"]')?.click();
    expect(animate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ duration: 150 }));
    vi.mocked(animate).mockClear();
    document.body.innerHTML = '';
    const el = await mount(true);
    button('[data-add="1024"]')?.click();
    expect(el.state.added).toEqual([1024]);
    expect(animate).not.toHaveBeenCalled();
  });
});
