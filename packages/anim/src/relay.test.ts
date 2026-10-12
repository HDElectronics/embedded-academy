// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT
// @vitest-environment happy-dom

import { handoffRelay } from '@ea/boards';
import { captureSpan } from '@ea/boards/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineHandoffRelay, type EaHandoffRelay, relayKeyTarget } from './handoff-relay.ts';
import {
  type RelayView,
  relayState,
  relayStatus,
  renderRelayConsole,
  renderRelayDetail,
  renderRelayStages,
  resolveRelay,
} from './relay.ts';

const view = resolveRelay(handoffRelay, (ref) => captureSpan(ref));

describe('resolveRelay', () => {
  it('reads every span from its capture', () => {
    expect(view.steps).toHaveLength(6);
    expect(view.steps[0]?.console[0]?.lines[0]).toBe('NOTICE:  Booting Trusted Firmware');
    expect(view.steps[3]?.handoff.span.lines.join('\n')).toContain('x0             0x7d5fb000');
    expect(view.steps[5]?.handoff.span.lines).toEqual(['Welcome to Buildroot', 'buildroot login: root']);
  });
});

describe('relayState', () => {
  it('marks finished, running and waiting stages', () => {
    expect(relayState(view, 2).stages.map((s) => s.state)).toEqual(['ok', 'ok', 'run', 'wait', 'wait', 'wait']);
  });

  it('keeps every image loaded so far and flags the new ones', () => {
    const loaded = relayState(view, 1).loaded;
    expect(loaded.map((l) => [l.image, l.isNew])).toEqual([
      ['BL2', false],
      ['BL31', true],
      ['U-Boot (BL33)', true],
    ]);
    expect(loaded[0]?.range).toBe('0x0E05_B000 to 0x0E06_3204');
    expect(relayState(view, 5).loaded.map((l) => l.image)).toContain('Device Tree');
  });

  it('clamps the step index', () => {
    expect(relayState(view, -3).index).toBe(0);
    expect(relayState(view, 99).index).toBe(5);
  });
});

describe('rendering', () => {
  it('shows each stage with its state word, level and world', () => {
    const html = renderRelayStages(relayState(view, 1));
    expect(html).toContain('[  OK  ]');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('EL1 · secure');
  });

  it('marks cut lines and the current stage in the console', () => {
    const html = renderRelayConsole(view, 0);
    expect(html).toContain('[ lines 13 to 25 not shown ]');
    expect(html).toContain('&gt; BL1 · m05-tfa-virt-debug.log:9-31');
    expect(renderRelayConsole(view, 5).match(/data-group=/g)).toHaveLength(6);
  });

  it('says when the hand-off comes from a separate run', () => {
    const html = renderRelayDetail(view, 3);
    expect(html).toContain('U-Boot hands over to Linux');
    expect(html).toContain('m10-gdb-start-kernel.log:14-18');
    expect(html).toMatch(/separate run/);
    expect(renderRelayDetail(view, 5)).toContain('PID 1 hands over to you');
    expect(relayStatus(view, 0)).toMatch(/^Stage 1 of 6: BL1\. Entry point 0x0E05_B000/);
  });
});

describe('relayKeyTarget', () => {
  it('maps arrows, Home and End, and ignores other keys', () => {
    expect(relayKeyTarget('ArrowRight', 0, 6)).toBe(1);
    expect(relayKeyTarget('ArrowDown', 5, 6)).toBe(5);
    expect(relayKeyTarget('ArrowLeft', 0, 6)).toBe(0);
    expect(relayKeyTarget('Home', 4, 6)).toBe(0);
    expect(relayKeyTarget('End', 1, 6)).toBe(5);
    expect(relayKeyTarget('a', 1, 6)).toBeUndefined();
  });
});

async function mount(data: RelayView, reducedMotion = false): Promise<EaHandoffRelay> {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({ matches: reducedMotion && query.includes('reduce'), media: query }) as MediaQueryList,
  );
  defineHandoffRelay();
  document.body.innerHTML = `
    <ea-handoff-relay>
      <script type="application/json" data-relay>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
      <ol data-part="stages">${renderRelayStages(relayState(data, 0))}</ol>
      <div data-part="detail">${renderRelayDetail(data, 0)}</div>
      <div data-part="console">${renderRelayConsole(data, 0)}</div>
      <button data-part="prev">Previous</button><button data-part="next">Next stage</button>
      <p data-part="status"></p>
    </ea-handoff-relay>`;
  await Promise.resolve();
  const el = document.querySelector('ea-handoff-relay');
  if (!el) throw new Error('not mounted');
  return el as EaHandoffRelay;
}

describe('<ea-handoff-relay>', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  const part = (name: string) => document.querySelector<HTMLElement>(`[data-part="${name}"]`);

  it('steps with Next and Previous, and stops at both ends', async () => {
    vi.useFakeTimers();
    const el = await mount(view);
    part('prev')?.click();
    expect(el.index).toBe(0);
    for (let k = 0; k < 8; k += 1) part('next')?.click();
    vi.runAllTimers();
    expect(el.index).toBe(5);
    expect(part('status')?.textContent).toMatch(/^Stage 6 of 6: PID 1/);
    expect(part('console')?.textContent).toContain('buildroot login: root');
    part('prev')?.click();
    expect(el.index).toBe(4);
  });

  it('jumps to a stage when you click it', async () => {
    const el = await mount(view);
    document.querySelector<HTMLElement>('[data-step="3"]')?.click();
    expect(el.index).toBe(3);
    expect(part('detail')?.textContent).toContain('Linux Image');
  });

  it('moves between stages with the arrow keys and keeps focus on the stage', async () => {
    const el = await mount(view);
    const key = (k: string) =>
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    document.querySelector<HTMLElement>('[data-step="0"]')?.focus();
    key('ArrowRight');
    expect(el.index).toBe(1);
    expect(document.activeElement?.getAttribute('data-step')).toBe('1');
    key('End');
    expect(el.index).toBe(5);
    key('Home');
    expect(el.index).toBe(0);
    expect(document.activeElement?.getAttribute('tabindex')).toBe('0');
  });

  it('switches instantly with reduced motion', async () => {
    const el = await mount(view, true);
    part('next')?.click();
    expect(el.index).toBe(1);
    const group = document.querySelector<HTMLElement>('.ea-relay__group.is-current');
    expect(group?.getAttribute('style')).toBeNull();
    expect(document.querySelector<HTMLElement>('.ea-relay__load.is-new')?.getAttribute('style')).toBeNull();
  });
});
