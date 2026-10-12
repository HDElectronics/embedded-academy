// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT
// @vitest-environment happy-dom

import { type ElLevel, type ElOp, ExceptionLevelsFigure, exceptionLevels as fig } from '@ea/boards';
import { captureSpan, readCapture } from '@ea/boards/node';
import { animate } from 'animejs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type ElevatorState,
  elevatorSources,
  moves,
  opHint,
  renderOps,
  renderPending,
  renderPosition,
  renderResult,
  run,
  startState,
} from './elevator.ts';
import { defineExceptionLevels, type EaExceptionLevels } from './exception-levels.ts';
import { nextButton } from './toolbar.ts';

vi.mock('animejs', () => ({ animate: vi.fn(), stagger: vi.fn() }));

const runAll = (ops: ElOp[], from: ElevatorState = startState(fig)) =>
  ops.reduce((s, op) => run(fig, s, op).state, from);

describe('exceptionLevels data', () => {
  it('parses against its schema', () => {
    expect(ExceptionLevelsFigure.parse(fig)).toEqual(fig);
  });

  it('encodes the Arm ARM rules for every instruction at every level', () => {
    const table = Object.fromEntries(fig.rules.map((r) => [`${r.op}@${r.at}`, r.result === 'up' ? r.to : r.result]));
    expect(table).toEqual({
      'svc@EL0': 'EL1',
      'svc@EL1': 'same',
      'svc@EL2': 'same',
      'svc@EL3': 'same',
      'hvc@EL0': 'undefined',
      'hvc@EL1': 'EL2',
      'hvc@EL2': 'same',
      'hvc@EL3': 'same',
      'smc@EL0': 'undefined',
      'smc@EL1': 'EL3',
      'smc@EL2': 'EL3',
      'smc@EL3': 'same',
      'eret@EL0': 'undefined',
      'eret@EL1': 'return',
      'eret@EL2': 'return',
      'eret@EL3': 'return',
    });
  });

  it('cites the Arm Architecture Reference Manual for every rule', () => {
    for (const rule of fig.rules) expect(rule.sources.map((s) => s.title).join()).toContain('DDI 0487');
  });

  it('takes every reset level from the m01 capture', () => {
    for (const r of fig.reset.runs) {
      const [line] = captureSpan(r.line);
      expect(line).toMatch(/^PSTATE=/);
      expect(line).toContain(` ${r.level}h `);
    }
  });

  it('names machine options the m01 capture ran', () => {
    const body = readCapture(fig.reset.runs[0]?.line.log ?? '').lines.join('\n');
    for (const r of fig.reset.runs) expect(body).toContain(`-machine ${r.option} `);
  });
});

describe('run', () => {
  it('goes up with svc, hvc and smc, saving one return per level', () => {
    const s = runAll(['svc', 'hvc', 'smc']);
    expect(s.at).toBe('EL3');
    expect(s.pending).toEqual([
      { level: 'EL1', back: 'EL0' },
      { level: 'EL2', back: 'EL1' },
      { level: 'EL3', back: 'EL2' },
    ]);
  });

  it('comes back down one level of the chain per eret, to the start', () => {
    const s = runAll(['svc', 'smc', 'eret']);
    expect(s).toEqual({ at: 'EL1', pending: [{ level: 'EL1', back: 'EL0' }] });
    expect(runAll(['eret'], s)).toEqual(startState(fig));
  });

  it('leaves the state alone for undefined and same-level instructions', () => {
    const start = startState(fig);
    for (const op of ['hvc', 'smc', 'eret'] as const) {
      const { state, outcome } = run(fig, start, op);
      expect(state).toBe(start);
      expect(outcome.rule.result).toBe('undefined');
      expect(renderResult(fig, outcome)).toContain('[ UNDEF ]');
    }
    const atEl1 = runAll(['svc']);
    expect(run(fig, atEl1, 'svc').state).toBe(atEl1);
    expect(renderResult(fig, run(fig, atEl1, 'svc').outcome)).toContain('stays at EL1');
  });

  it('does not return when nothing was saved at this level', () => {
    const odd: ElevatorState = { at: 'EL2', pending: [] };
    const { state, outcome } = run(fig, odd, 'eret');
    expect(state).toBe(odd);
    expect(moves(fig, odd, 'eret')).toBe(false);
    expect(opHint(fig, odd, 'eret')).toBe('nothing saved to return to');
    expect(renderResult(fig, outcome)).toContain('no saved state');
  });
});

describe('rendering', () => {
  const tokenCell = (at: ElLevel) => {
    const div = document.createElement('div');
    div.innerHTML = renderPosition(fig, { at, pending: [] });
    const token = div.querySelector('[data-token]');
    const cell = token?.closest('.ea-ladder__cell');
    const row = cell?.closest('[role="row"]');
    return { count: div.querySelectorAll('[data-token]').length, cell, level: row?.querySelector('b')?.textContent };
  };

  it('draws one CPU marker, in the Normal world below EL3 and the Secure world at EL3', () => {
    expect(tokenCell('EL1')).toMatchObject({ count: 1, level: 'EL1' });
    expect(tokenCell('EL1').cell?.classList.contains('is-normal')).toBe(true);
    expect(tokenCell('EL3').cell?.classList.contains('is-secure')).toBe(true);
  });

  it('marks each instruction with where it goes or why it is off', () => {
    const html = renderOps(fig, startState(fig));
    expect(html).toContain('data-op="svc" aria-disabled="false"');
    expect(html).toContain('data-op="hvc" aria-disabled="true"');
    expect(html).toContain('undefined at EL0');
    expect(html).toContain('to EL1');
  });

  it('names the registers that hold each pending return, newest first', () => {
    const html = renderPending(runAll(['svc', 'smc']));
    expect(html.indexOf('ELR_EL3')).toBeLessThan(html.indexOf('ELR_EL1'));
    expect(html).toContain('SPSR_EL3</code>: back to EL1');
    expect(renderPending(startState(fig))).toContain('nothing to return to');
  });

  it('says when the core changes security state', () => {
    expect(renderResult(fig, run(fig, runAll(['svc']), 'smc').outcome)).toContain('Secure state');
    expect(renderResult(fig, run(fig, runAll(['svc', 'smc']), 'eret').outcome)).toContain('Non-secure state');
  });

  it('lists each source document once, with every section cited', () => {
    const sources = elevatorSources(fig);
    expect(new Set(sources.map((s) => s.title)).size).toBe(sources.length);
    const arm = sources.find((s) => s.title.includes('DDI 0487'));
    expect(arm?.section).toContain('SVC, HVC, SMC, ERET');
    expect(arm?.section).toContain('ELR_ELx and SPSR_ELx');
  });
});

describe('nextButton', () => {
  it('wraps with the arrows and jumps with Home and End', () => {
    expect(nextButton('ArrowRight', 3, 4)).toBe(0);
    expect(nextButton('ArrowUp', 0, 4)).toBe(3);
    expect(nextButton('End', 0, 4)).toBe(3);
    expect(nextButton('Home', 2, 4)).toBe(0);
    expect(nextButton('a', 2, 4)).toBe(-1);
    expect(nextButton('ArrowDown', 0, 0)).toBe(-1);
  });
});

describe('<ea-exception-levels>', () => {
  const mount = async (reducedMotion: boolean) => {
    vi.stubGlobal(
      'matchMedia',
      (query: string) => ({ matches: reducedMotion && query.includes('reduce'), media: query }) as MediaQueryList,
    );
    defineExceptionLevels();
    const s = startState(fig);
    document.body.innerHTML = `
      <ea-exception-levels>
        <script type="application/json" data-elevator>${JSON.stringify(fig)}</script>
        <div data-part="position">${renderPosition(fig, s)}</div>
        <div data-part="ops">${renderOps(fig, s)}</div>
        <div data-part="result">${renderResult(fig)}</div>
        <ul data-part="pending">${renderPending(s)}</ul>
        <button data-part="reset">Back to EL0</button>
      </ea-exception-levels>`;
    await Promise.resolve();
    const el = document.querySelector('ea-exception-levels');
    if (!el) throw new Error('not mounted');
    return el as EaExceptionLevels;
  };
  const op = (name: string) => document.querySelector<HTMLElement>(`[data-op="${name}"]`);

  beforeEach(() => vi.mocked(animate).mockClear());
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('rides up and back down, and resets', async () => {
    const el = await mount(false);
    op('svc')?.click();
    op('smc')?.click();
    expect(el.state.at).toBe('EL3');
    expect(document.querySelector('[data-part="result"]')?.textContent).toContain('smc #0: EL1 → EL3');
    expect(document.querySelectorAll('[data-frame]')).toHaveLength(2);
    expect(document.activeElement).toBe(op('smc'));
    op('eret')?.click();
    expect(el.state.at).toBe('EL1');
    document.querySelector<HTMLElement>('[data-part="reset"]')?.click();
    expect(el.state).toEqual(startState(fig));
    expect(document.querySelector('[data-part="result"]')?.textContent).toBe(fig.intro);
  });

  it('explains a disabled instruction without moving', async () => {
    const el = await mount(false);
    expect(el.canMove('hvc')).toBe(false);
    op('hvc')?.click();
    expect(el.state.at).toBe('EL0');
    expect(document.querySelector('[data-part="result"]')?.textContent).toContain('hvc is undefined at EL0');
  });

  it('moves focus between instructions with the arrow keys', async () => {
    await mount(false);
    op('svc')?.focus();
    op('svc')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(op('hvc'));
    op('hvc')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(op('eret'));
  });

  it('animates the move, and switches instantly with reduced motion', async () => {
    await mount(false);
    op('svc')?.click();
    expect(animate).toHaveBeenCalled();
    vi.mocked(animate).mockClear();
    document.body.innerHTML = '';
    const el = await mount(true);
    op('svc')?.click();
    expect(el.state.at).toBe('EL1');
    expect(animate).not.toHaveBeenCalled();
  });
});
