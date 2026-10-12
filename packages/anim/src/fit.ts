// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// SplFit: the BeagleBone Black SPL against the SRAM the boot ROM loads it into.
// The learner adds bytes until the link would fail. Rendered the same on the
// server and in the browser.

import type { SplFitFigure } from '@ea/boards';
import { esc } from './render.ts';

export interface FitState {
  /** Byte counts added so far, in order, so Undo can take the last one back. */
  added: number[];
}

export function fitStart(): FitState {
  return { added: [] };
}

export function splSize(fig: SplFitFigure, state: FitState): number {
  return state.added.reduce((sum, n) => sum + n, fig.spl.bytes);
}

/** Bytes left before limit B; negative once SPL is past it. */
export function fitMargin(fig: SplFitFigure, state: FitState): number {
  return fig.limitB.bytes - splSize(fig, state);
}

export function splFits(fig: SplFitFigure, state: FitState): boolean {
  return fitMargin(fig, state) >= 0;
}

/** Adds `bytes` while SPL still links. Once it fails, adding stops until Undo or Reset. */
export function addBytes(fig: SplFitFigure, state: FitState, bytes: number): FitState {
  return splFits(fig, state) ? { added: [...state.added, bytes] } : state;
}

export function undoFit(state: FitState): FitState {
  return { added: state.added.slice(0, -1) };
}

export function stepLabel(bytes: number): string {
  return bytes % 1024 === 0 ? `+${bytes / 1024} KiB` : `+${bytes} bytes`;
}

const pct = (n: number) => `${(Math.max(0, Math.min(1, n)) * 100).toFixed(3)}%`;

/** Width of `bytes` on the whole-area scale, 0 to limit A. */
export function areaShare(fig: SplFitFigure, bytes: number): string {
  return pct(bytes / fig.limitA.bytes);
}

/**
 * Position on the zoomed scale: the end of the area, from as far below limit B
 * as limit A is above it, up to limit A. Limit B sits in the middle.
 */
export function zoomShare(fig: SplFitFigure, bytes: number): string {
  const gap = fig.limitA.bytes - fig.limitB.bytes;
  return pct((bytes - (fig.limitB.bytes - gap)) / (2 * gap));
}

const STATUS = { ok: '[  OK  ]', fail: '[FAILED]' } as const;

function row(name: string, label: string, bytes: number, width: string, cls = ''): string {
  return (
    `<div class="ea-fit__row" data-row="${name}">` +
    `<span class="ea-fit__name">${esc(label)}</span>` +
    `<span class="ea-fit__track"><span class="ea-fit__fill ${cls}" data-fill="${name}" style="width: ${width}"></span></span>` +
    `<span class="ea-fit__bytes">${bytes} bytes</span></div>`
  );
}

/** The whole download area: the two limits and SPL, to scale. */
export function renderBudget(fig: SplFitFigure, state: FitState): string {
  const size = splSize(fig, state);
  const ok = splFits(fig, state);
  return (
    row('a', fig.limitA.label, fig.limitA.bytes, areaShare(fig, fig.limitA.bytes), 'is-limit') +
    row('b', fig.limitB.label, fig.limitB.bytes, areaShare(fig, fig.limitB.bytes), 'is-limit') +
    row('spl', fig.spl.label, size, areaShare(fig, size), ok ? 'is-ok' : 'is-fail')
  );
}

/**
 * The end of the area, zoomed in so the margin and the scratch space show.
 * Limit B sits in the middle of the track and limit A at its right edge.
 */
export function renderZoom(fig: SplFitFigure, state: FitState): string {
  const size = splSize(fig, state);
  const ok = splFits(fig, state);
  const m = fitMargin(fig, state);
  const [from, to] = ok ? [size, fig.limitB.bytes] : [fig.limitB.bytes, size];
  const cls = ok ? 'is-ok' : 'is-fail';
  return (
    `<div class="ea-fit__zoom-track" aria-hidden="true">` +
    `<span class="ea-fit__fill ${cls}" data-fill="zoom" style="width: ${zoomShare(fig, size)}"></span>` +
    `<span class="ea-fit__gap ${cls}" style="left: ${zoomShare(fig, from)}; width: calc(${zoomShare(fig, to)} - ${zoomShare(fig, from)})"></span>` +
    `<span class="ea-fit__scratch"></span></div>` +
    `<div class="ea-fit__axis" aria-hidden="true"><span></span><span class="ea-fit__axis-right"><span>^ limit B</span><span>limit A ^</span></span></div>` +
    `<ul class="ea-fit__key">` +
    `<li><span class="ea-fit__swatch ${cls}"></span>${ok ? 'margin' : 'overflow'}: <b>${ok ? `${m} bytes to spare` : `${-m} bytes past limit B`}</b></li>` +
    `<li><span class="ea-fit__swatch is-scratch"></span>between limit B and limit A: ${esc(fig.scratch.text)}</li></ul>`
  );
}

/** The link result: a status word, the margin, and what it means. */
export function renderFitResult(fig: SplFitFigure, state: FitState): string {
  const m = fitMargin(fig, state);
  const added = splSize(fig, state) - fig.spl.bytes;
  if (m < 0) {
    return (
      `<p class="ea-fit__verdict is-fail"><span class="ea-fit__status">${STATUS.fail}</span> ${-m} bytes past limit B</p>` +
      `<p class="ea-fit__why">You added ${added} bytes. ${esc(fig.fails.text)}</p>`
    );
  }
  const what =
    added === 0
      ? `As built, ${esc(fig.spl.label)} is ${fig.spl.bytes} bytes.`
      : `You added ${added} bytes and SPL still links.`;
  return (
    `<p class="ea-fit__verdict is-ok"><span class="ea-fit__status">${STATUS.ok}</span> fits under limit B, ${m} bytes to spare</p>` +
    `<p class="ea-fit__why">${what} ${esc(fig.fits.text)}</p>`
  );
}

/** The controls: one button per step, Undo and Reset, with their disabled state. */
export function renderFitControls(fig: SplFitFigure, state: FitState): string {
  const ok = splFits(fig, state);
  const steps = fig.steps
    .map(
      (n, k) =>
        `<button type="button" class="ea-btn${k === 0 ? ' ea-btn--primary' : ''}" data-add="${n}" aria-disabled="${!ok}">${stepLabel(n)}</button>`,
    )
    .join('');
  return (
    steps +
    `<button type="button" class="ea-btn" data-part="undo" aria-disabled="${state.added.length === 0}">Undo</button>` +
    `<button type="button" class="ea-btn" data-part="reset">Reset</button>`
  );
}

/** u-boot.img laid out in blocks the size of the whole download area. */
export function imageBlocks(fig: SplFitFigure): number {
  return Math.ceil(fig.image.bytes / fig.limitA.bytes);
}

export function renderFitImage(fig: SplFitFigure): string {
  const blocks = Array.from(
    { length: imageBlocks(fig) },
    (_, k) => `<span class="ea-fit__block${k === 0 ? ' is-area' : ''}"></span>`,
  ).join('');
  return (
    `<p class="ea-fit__image-sizes"><code>${esc(fig.image.label)}</code>: ${fig.image.bytes} bytes. ` +
    `Download area: ${fig.limitA.bytes} bytes.</p>` +
    `<div class="ea-fit__blocks" role="img" aria-label="${esc(fig.image.label)} drawn in blocks the size of the download area: one solid block is the area, the dashed ones are what does not fit">${blocks}</div>` +
    `<p class="ea-fit__legend t-small">Solid: the SRAM download area. Dashed: the rest of <code>${esc(fig.image.label)}</code>, in blocks of the same size.</p>` +
    `<p class="ea-fit__why">${esc(fig.twoStages.text)}</p>`
  );
}
