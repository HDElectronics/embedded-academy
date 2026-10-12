// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT
// @vitest-environment happy-dom

import { formatAddress, placeDtb } from '@ea/boards';
import { captureSpan } from '@ea/boards/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dtbRelation, renderPlaceScene, stripPercent, stripView, toPlaceDtbFigure, zoomView } from './place-dtb.ts';
import { mountReplayForTest, part, radio } from './replay.test-helpers.ts';

const fig = toPlaceDtbFigure(placeDtb, captureSpan);
const index = (id: string) => fig.choices.findIndex((c) => c.id === id);

describe('the PlaceDtb strip', () => {
  it('draws DRAM from its start to an eighth past the highest address, in whole MiB', () => {
    expect(stripView(0x4000_0000, [0x4800_0000, 0x42c3_0000])).toEqual({ start: 0x4000_0000, end: 0x4900_0000 });
    expect(fig.view.start).toBe(placeDtb.dram.start.value);
    expect(fig.view.end).toBeGreaterThan(Math.max(...fig.dtbs.map((d) => d.at)));
  });

  it('places addresses by their value, clamped to the strip', () => {
    const view = { start: 0x4000_0000, end: 0x4900_0000 };
    expect(stripPercent(view, 0x4000_0000)).toBe(0);
    expect(stripPercent(view, 0x4800_0000)).toBe(88.89);
    expect(stripPercent(view, 0x7fff_ffff)).toBe(100);
  });

  it('says where each tree sits relative to the kernel', () => {
    expect(dtbRelation(fig, fig.dtbs[index('inside')]?.at ?? 0)).toBe('inside');
    expect(dtbRelation(fig, fig.dtbs[index('above')]?.at ?? 0)).toBe('above');
    expect(dtbRelation(fig, 0x4000_0000)).toBe('below');
  });

  it('shows only addresses that come from the captures', () => {
    const html = renderPlaceScene(fig, index('inside'));
    const shown = [...html.matchAll(/0x[0-9A-F]{4}_[0-9A-F]{4}/g)].map((m) => m[0]);
    const captured = [
      placeDtb.dram.start,
      placeDtb.dram.end,
      placeDtb.kernel.start,
      placeDtb.kernel.fileSize,
      placeDtb.kernel.end,
      ...placeDtb.choices.map((c) => c.dtb.at),
    ].map((n) => formatAddress(n.value));
    expect(shown.length).toBeGreaterThan(4);
    for (const a of shown) expect(captured).toContain(a);
    expect(html).toContain('! dtb');
    expect(html).toContain('inside the kernel');
  });

  it('zooms on the kernel’s end, where the tree inside the kernel shows', () => {
    const zoom = zoomView(fig);
    const fileEnd = placeDtb.kernel.start.value + placeDtb.kernel.fileSize.value;
    expect(zoom.start).toBeLessThan(fileEnd);
    expect(zoom.end).toBeGreaterThan(placeDtb.kernel.end.value);
    const inside = renderPlaceScene(fig, index('inside'));
    expect(inside).toContain('data-token="dtb-zoom"');
    const above = renderPlaceScene(fig, index('above'));
    expect(above).not.toContain('data-token="dtb-zoom"');
    expect(above).toContain('the marker is off this view');
  });

  it('marks the empty address and the foreign tree with words, not colour alone', () => {
    expect(renderPlaceScene(fig, index('nothing'))).toContain('no dtb</span>');
    expect(renderPlaceScene(fig, index('foreign'))).toContain('wrong dtb</span>');
    expect(renderPlaceScene(fig, 99)).toBe('');
  });

  it('suffixes each choice with its address and replays real lines', () => {
    expect(fig.choices[index('above')]?.suffix).toBe('0x4800_0000');
    expect(fig.choices[index('inside')]?.lines.at(-1)).toBe(
      'ERROR: FDT image overlaps OS image (OS=40400000..42c30000)',
    );
  });
});

describe('<ea-place-dtb>', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('moves the tree above the kernel and replays the boot', async () => {
    vi.useFakeTimers();
    await mountReplayForTest('ea-place-dtb', fig, renderPlaceScene);
    radio(index('above')).click();
    expect(part('scene').querySelector('[data-token="dtb"]')?.className).toContain('is-tree');
    expect(part('scene').textContent).toContain('above the kernel');
    expect(part('outcome').textContent).toContain('[  OK  ] the kernel starts');
    vi.runAllTimers();
    expect(part('console').textContent).toContain('Starting kernel ...');
  });
});
