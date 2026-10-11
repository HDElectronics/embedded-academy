// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// HTML for the animation components. The same functions render on the server
// (the page is complete before any script runs) and in the browser.

import type { Verification, World } from '@ea/boards';
import type { ChainState, StageState } from './model.ts';
import type { ChainBoard, ChainStage } from './types.ts';

export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const STATE_LABEL: Record<StageState, string> = { ok: '[  OK  ]', run: '[ RUN  ]', wait: '[ WAIT ]' };

const WORLD: Record<World, { label: string; tag: string }> = {
  firmware: { label: 'Firmware, no Arm world yet', tag: 'ea-tag--firmware' },
  secure: { label: 'Secure world', tag: 'ea-tag--secure' },
  normal: { label: 'Normal world', tag: 'ea-tag--normal' },
  vendor: { label: 'Secure side held by vendor ROM', tag: '' },
};

export const VERIFICATION_LABEL: Record<Verification, string> = {
  hardware: 'verified on board',
  emulated: 'verified in QEMU',
  unverified: 'not yet verified',
};

export function renderTabs(boards: ChainBoard[], selected: number): string {
  return boards
    .map(
      (b, k) =>
        `<button type="button" class="ea-tab" role="tab" id="tab-${esc(b.id)}" aria-selected="${k === selected}" tabindex="${k === selected ? 0 : -1}" data-board="${k}">` +
        `<span class="ea-tab__mark ea-tab__mark--${esc(b.id === 'stm32mp157' ? 'stm' : b.id === 'rpi4' ? 'rpi' : b.id)}"></span>${k}:${esc(b.id)}</button>`,
    )
    .join('');
}

export function renderRail(board: ChainBoard, state: ChainState): string {
  return board.stages
    .map((s, k) => {
      const st = state.stages.at(k)?.state ?? 'wait';
      return (
        `<li><button type="button" class="ea-stage${st === 'run' ? ' ea-stage--active' : ''}" data-stage="${k}" aria-current="${st === 'run' ? 'step' : 'false'}">` +
        `<span class="ea-stage__head"><span class="ea-stage__state ea-stage__state--${st}">${STATE_LABEL[st]}</span><span>${esc(s.name)}</span></span>` +
        `<span class="ea-stage__file">${esc(s.file)}</span></button></li>`
      );
    })
    .join('');
}

function renderSources(stage: ChainStage): string {
  const items = stage.sources
    .map((src) => {
      const title = esc(src.title) + (src.section ? `, ${esc(src.section)}` : '');
      return src.url ? `<a href="${esc(src.url)}" rel="noopener">${title}</a>` : title;
    })
    .join('; ');
  return `<p class="ea-chain__sources t-small">Sources: ${items}</p>`;
}

export function renderDetail(board: ChainBoard, state: ChainState): string {
  const s = state.stage;
  const world = WORLD[s.world];
  return (
    `<p class="ea-chain__count t-label">Stage ${state.index + 1} of ${board.stages.length}</p>` +
    `<h3 class="ea-chain__name">${esc(s.name)}</h3>` +
    `<p class="ea-chain__file">${esc(s.file)} · loaded from ${esc(s.from)}</p>` +
    `<div class="ea-stage__tags"><span class="ea-tag">${esc(s.core)}</span><span class="ea-tag ${world.tag}">${esc(s.level)}</span>` +
    `<span class="ea-tag ${world.tag}">${esc(world.label)}</span><span class="ea-tag">${VERIFICATION_LABEL[s.verification]}</span></div>` +
    `<ul class="ea-chain__does">${s.does.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` +
    renderSources(s)
  );
}

function renderImage(file: string, address = '', fresh = false): string {
  return (
    `<span class="ea-memmap__chip${fresh ? ' is-active' : ''}" data-file="${esc(file)}">${esc(file)}` +
    (address ? `<span class="ea-memmap__at"> @ ${esc(address)}</span>` : '') +
    '</span>'
  );
}

/** Memory regions, top to bottom as the board lists them. With a state, also the images in them and in storage. */
export function renderMemory(board: ChainBoard, state?: ChainState): string {
  const storage = (state?.storage ?? [])
    .map(
      (g) =>
        `<div class="ea-memmap__store"><span class="ea-memmap__label">${esc(g.from)}</span>` +
        `<div class="ea-memmap__chips">${g.files.map((f) => renderImage(f)).join('')}</div></div>`,
    )
    .join('');
  const regions = board.regions
    .map((r, k) => {
      const rs = state?.regions.at(k);
      const images = (rs?.images ?? []).map((m) => renderImage(m.file, m.address, m.fresh)).join('');
      return (
        `<div class="ea-memmap__region${rs?.lit ? ' is-lit' : ''}" data-region="${esc(r.id)}">` +
        `<div class="ea-memmap__head"><span class="ea-memmap__label">${esc(r.label)}</span><span class="ea-memmap__detail">${esc(r.detail)}</span></div>` +
        (rs?.lit && state ? `<p class="ea-memmap__runs">* runs here: ${esc(state.stage.name)}</p>` : '') +
        (state ? `<div class="ea-memmap__chips">${images}</div>` : '') +
        '</div>'
      );
    })
    .join('');
  return (
    (storage
      ? `<div class="ea-memmap__storage" role="group" aria-label="Storage"><p class="ea-memmap__runs">waiting in storage</p>${storage}</div>`
      : '') + regions
  );
}

const TIMESTAMP = /^(\[\s*\d+\.\d+\])(.*)$/;

export function renderLine(line: string): string {
  if (line.startsWith('(')) return `<span class="note">${esc(line)}</span>`;
  const m = TIMESTAMP.exec(line);
  if (m?.[1] !== undefined) return `<span class="ts">${esc(m[1])}</span>${esc(m[2] ?? '')}`;
  return esc(line);
}

export function renderConsole(lines: string[]): string {
  return lines.map((l) => `<div class="ea-console__line">${renderLine(l)}</div>`).join('');
}
