// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';
import { captureSpan } from '../node.ts';
import type { CaptureRef } from '../schema.ts';
import { handoffRelay, type RelayStep } from './handoff-relay.ts';

const text = (ref: CaptureRef) => captureSpan(ref).join('\n');

/** Every capture a step shows: its console, its load lines and its hand-off lines. */
const stepText = (s: RelayStep) => [...s.console, ...s.loads.map((l) => l.ref), s.handoff.ref].map(text).join('\n');

/** True when `hex` appears in `haystack` as a whole number, with or without 0x and leading zeros. */
const hasHex = (haystack: string, hex: string) =>
  new RegExp(`(?<![0-9a-f])(?:0x)?0*${hex}(?![0-9a-f])`, 'i').test(haystack);

const hexIn = (s: string) =>
  [...s.matchAll(/0x([0-9A-F_]+)/g)].map((m) =>
    (m[1] ?? '')
      .replace(/_/g, '')
      .replace(/^0+(?=.)/, '')
      .toLowerCase(),
  );

describe('handoffRelay data', () => {
  const steps = handoffRelay.steps;

  it('walks the chain from BL1 to PID 1', () => {
    expect(steps.map((s) => s.name)).toEqual(['BL1', 'BL2', 'BL31', 'U-Boot', 'Linux', 'PID 1']);
  });

  it('reads every span from a capture, in order and without blank-only spans', () => {
    for (const s of steps) {
      for (const [i, ref] of s.console.entries()) {
        expect(captureSpan(ref).some((line) => line.trim() !== '')).toBe(true);
        const prev = s.console[i - 1];
        if (prev?.log === ref.log) expect(ref.from).toBeGreaterThan(prev.to);
      }
    }
  });

  it('states each load address, end and size exactly as its line prints it', () => {
    for (const load of steps.flatMap((s) => s.loads)) {
      const line = text(load.ref);
      expect(hasHex(line, load.at.toString(16))).toBe(true);
      if (load.end) expect(hasHex(line, load.end.toString(16))).toBe(true);
      if (load.size) expect(hasHex(line, load.size.toString(16))).toBe(true);
    }
    expect(text({ log: 'qemu/m05-tfa-virt-debug.log', from: 27, to: 27 })).toContain('0xe05b000');
  });

  it('takes every number in its words from the captures the step shows', () => {
    for (const s of steps) {
      const shown = stepText(s);
      for (const hex of hexIn(`${s.handoff.summary} ${s.handoff.note ?? ''} ${s.explain}`)) {
        expect(hasHex(shown, hex), `${s.id}: 0x${hex}`).toBe(true);
      }
      for (const m of s.explain.matchAll(/image (\d+)/g)) expect(shown).toContain(`image id ${m[1]}`);
    }
  });

  it('runs each TF-A stage at the level the previous stage put in SPSR', () => {
    const levels: Record<string, string> = { '5': 'EL1', d: 'EL3' };
    for (const [i, s] of steps.slice(0, 3).entries()) {
      const spsr = /SPSR = 0x([0-9a-f]+)/.exec(text(s.handoff.ref))?.[1] ?? '';
      const next = steps[i + 1];
      expect(levels[spsr.slice(-1)], `${s.id} hands over at ${spsr}`).toBe(next?.level);
    }
  });

  it('shows the hand-off to the kernel from a separate run, and says so', () => {
    const uboot = steps.find((s) => s.id === 'u-boot');
    expect(uboot?.handoff.ref.log).not.toBe(uboot?.console[0]?.log);
    expect(uboot?.handoff.note).toMatch(/separate run/);
    const regs = text(uboot?.handoff.ref ?? { log: 'qemu/m10-gdb-start-kernel.log', from: 15, to: 15 });
    expect(regs).toMatch(/x0\s+0x7d5fb000/);
    for (const r of ['x1', 'x2', 'x3']) expect(regs).toMatch(new RegExp(`${r}\\s+0x0\\s`));
    expect(text({ log: 'qemu/m10-gdb-start-kernel.log', from: 31, to: 31 })).toBe('Working FDT set to 7d5fb000');
  });

  it('places Linux at EL1, as the kernel itself reports', () => {
    expect(text({ log: 'qemu/m10-chain-virt.log', from: 150, to: 150 })).toContain('CPU: All CPU(s) started at EL1');
    expect(steps.find((s) => s.id === 'linux')?.level).toBe('EL1');
  });
});
