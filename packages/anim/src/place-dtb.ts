// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// PlaceDtb: a strip of DRAM with the loaded kernel, and the address handed to
// `booti` for the Device Tree. Positions are computed from the captured
// addresses. Rendered the same on the server and in the browser.

import { type DtbChoice, formatAddress, type PlaceDtb } from '@ea/boards';
import { esc } from './render.ts';
import { type ReplayData, type SpanReader, toReplayChoice } from './replay.ts';

export interface PlaceDtbFigure extends ReplayData {
  dram: { start: number; end: number };
  kernel: { start: number; fileSize: number; end: number };
  /** The Device Tree address and what it holds, one per choice. */
  dtbs: { at: number; holds: DtbChoice['dtb']['holds'] }[];
  /** The part of DRAM the strip draws. */
  view: { start: number; end: number };
}

const MIB = 0x10_0000;

/**
 * The part of DRAM to draw: from its start to past the highest address in
 * play, by an eighth of that span, rounded up to a whole MiB.
 */
export function stripView(start: number, addresses: number[]): { start: number; end: number } {
  const top = Math.max(start + MIB, ...addresses);
  return { start, end: start + Math.ceil(((top - start) * 9) / 8 / MIB) * MIB };
}

/** Where `address` falls on the strip, in percent, clamped to the strip. */
export function stripPercent(view: { start: number; end: number }, address: number): number {
  const p = ((address - view.start) / (view.end - view.start)) * 100;
  return Math.round(Math.max(0, Math.min(100, p)) * 100) / 100;
}

export function toPlaceDtbFigure(data: PlaceDtb, read: SpanReader): PlaceDtbFigure {
  const dtbs = data.choices.map((c) => ({ at: c.dtb.at.value, holds: c.dtb.holds }));
  return {
    choices: data.choices.map((c) => toReplayChoice(c, read, formatAddress(c.dtb.at.value))),
    dram: { start: data.dram.start.value, end: data.dram.end.value },
    kernel: { start: data.kernel.start.value, fileSize: data.kernel.fileSize.value, end: data.kernel.end.value },
    dtbs,
    view: stripView(data.dram.start.value, [data.kernel.end.value, ...dtbs.map((d) => d.at)]),
  };
}

/** Where the tree sits relative to the kernel. */
export function dtbRelation(fig: PlaceDtbFigure, at: number): 'below' | 'inside' | 'above' {
  if (at < fig.kernel.start) return 'below';
  return at < fig.kernel.end ? 'inside' : 'above';
}

const HOLDS: Record<DtbChoice['dtb']['holds'], { mark: string; text: string }> = {
  tree: { mark: 'dtb', text: 'a copy of this machine’s tree' },
  nothing: { mark: 'no dtb', text: 'no tree' },
  foreign: { mark: 'wrong dtb', text: 'another board’s tree' },
};

/** A close view of the kernel's end: the end of the Image file and of `image_size`, with room either side. */
export function zoomView(fig: PlaceDtbFigure): { start: number; end: number } {
  const fileEnd = fig.kernel.start + fig.kernel.fileSize;
  const pad = Math.max(1, Math.round((fig.kernel.end - fileEnd) / 2));
  return { start: fileEnd - pad, end: fig.kernel.end + pad };
}

type View = { start: number; end: number };

/** One strip: the Image file, the BSS after it, and the dtb marker when it falls in view. */
function renderStrip(fig: PlaceDtbFigure, view: View, index: number, token: string, label: string): string {
  const dtb = fig.dtbs[index];
  if (!dtb) return '';
  const at = (n: number) => stripPercent(view, n);
  const fileEnd = fig.kernel.start + fig.kernel.fileSize;
  const relation = dtbRelation(fig, dtb.at);
  const inView = dtb.at >= view.start && dtb.at <= view.end;
  const pos = at(dtb.at);
  const marker = inView
    ? `<span class="ea-place__dtb is-${dtb.holds}${relation === 'inside' ? ' is-inside' : ''}${pos > 60 ? ' is-end' : ''}" data-token="${token}" style="--at: ${pos}%">` +
      `<span class="ea-place__flag">${relation === 'inside' ? '! ' : ''}${esc(HOLDS[dtb.holds].mark)}</span></span>`
    : '';
  return (
    `<div class="ea-place__strip" role="img" aria-label="${esc(label)}">` +
    `<span class="ea-place__kernel" style="--from: ${at(fig.kernel.start)}%; --to: ${at(fileEnd)}%"><span class="ea-place__name">Image</span></span>` +
    `<span class="ea-place__bss" style="--from: ${at(fileEnd)}%; --to: ${at(fig.kernel.end)}%"><span class="ea-place__name">BSS</span></span>` +
    marker +
    '</div>'
  );
}

export function renderPlaceScene(fig: PlaceDtbFigure, index: number): string {
  const dtb = fig.dtbs[index];
  if (!dtb) return '';
  const relation = dtbRelation(fig, dtb.at);
  const holds = HOLDS[dtb.holds];
  const kernelEnd = formatAddress(fig.kernel.end);
  const where = `${holds.mark} at ${formatAddress(dtb.at)}, ${relation} the kernel`;
  const zoom = zoomView(fig);
  const zoomed = dtb.at >= zoom.start && dtb.at <= zoom.end;
  return (
    renderStrip(
      fig,
      fig.view,
      index,
      'dtb',
      `DRAM from ${formatAddress(fig.view.start)}: kernel from ${formatAddress(fig.kernel.start)} to ${kernelEnd}; ${where}`,
    ) +
    `<p class="ea-place__axis t-small" aria-hidden="true"><span>${formatAddress(fig.view.start)}</span><span>DRAM continues to ${formatAddress(fig.dram.end)}</span></p>` +
    `<p class="ea-pane__label ea-place__zoom-label">Zoom: the kernel’s end${zoomed ? '' : '; the marker is off this view'}</p>` +
    renderStrip(
      fig,
      zoom,
      index,
      'dtb-zoom',
      `Zoom on the kernel’s end: the Image file ends, then the BSS runs to ${kernelEnd}; ${zoomed ? where : `${holds.mark} out of this view`}`,
    ) +
    `<p class="ea-place__ticks t-small" aria-hidden="true"><span style="--at: ${stripPercent(zoom, fig.kernel.end)}%">end of kernel ${kernelEnd}</span></p>` +
    '<dl class="ea-place__legend">' +
    `<div><dt><span class="ea-place__key is-kernel"></span>Image file</dt><dd>from ${formatAddress(fig.kernel.start)}, size ${formatAddress(fig.kernel.fileSize)}</dd></div>` +
    `<div><dt><span class="ea-place__key is-bss"></span>BSS</dt><dd>to ${kernelEnd}, the end of <code>image_size</code></dd></div>` +
    `<div><dt><span class="ea-place__key is-${dtb.holds}${relation === 'inside' ? ' is-inside' : ''}"></span>${esc(holds.mark)}</dt><dd>at ${formatAddress(dtb.at)}, ${relation} the kernel: ${esc(holds.text)}</dd></div>` +
    '</dl>' +
    '<p class="ea-place__note t-small">Addresses to scale; the dtb marker is wider than the tree.</p>'
  );
}
