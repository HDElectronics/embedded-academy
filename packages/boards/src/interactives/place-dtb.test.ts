// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';
import { captureSpan, readCapture } from '../node.ts';
import { PlaceDtb, placeDtb } from './place-dtb.ts';
import { type CapturedNumber, ReplayScenario } from './replay.ts';

/** The captured line prints the value, in the hex spelling U-Boot and Linux use. */
function expectCaptured(n: CapturedNumber): void {
  expect(captureSpan(n.ref).join('\n').toLowerCase()).toContain(n.value.toString(16));
}

describe('placeDtb data', () => {
  it('reads every address and size it states from a capture', () => {
    const { dram, kernel, choices } = placeDtb;
    for (const n of [dram.start, dram.end, kernel.start, kernel.fileSize, kernel.end, ...choices.map((c) => c.dtb.at)])
      expectCaptured(n);
  });

  it('takes the kernel range from U-Boot’s own overlap message', () => {
    const line = captureSpan(placeDtb.kernel.end.ref).join('');
    const { start, end } = placeDtb.kernel;
    expect(line).toContain(
      `ERROR: FDT image overlaps OS image (OS=${start.value.toString(16)}..${end.value.toString(16)})`,
    );
  });

  it('loads the kernel at the same kernel_addr_r in every run it replays', () => {
    const { start, fileSize } = placeDtb.kernel;
    for (const c of placeDtb.choices) {
      const { lines } = readCapture(c.console[0]?.log ?? '');
      expect(lines).toContain(
        `loading kernel to address ${start.value.toString(16)} size ${fileSize.value.toString(16)}`,
      );
    }
  });

  it('replays U-Boot’s real answer for each choice', () => {
    const text = (id: string) =>
      (placeDtb.choices.find((c) => c.id === id)?.console ?? []).flatMap((ref) => captureSpan(ref)).join('\n');
    expect(text('inside')).toContain('ERROR: FDT image overlaps OS image');
    expect(text('above')).toContain('Starting kernel ...');
    expect(text('nothing')).toContain('Could not find a valid device tree');
    expect(text('foreign')).toContain('load virtio 0 0x48000000 bcm2711-rpi-4-b.dtb');
    expect(text('foreign')).not.toContain('Booting Linux');
  });

  it('places the tree inside the kernel for the failing overlap, above it for the boot', () => {
    const at = (id: string) => placeDtb.choices.find((c) => c.id === id)?.dtb.at.value ?? 0;
    const fileEnd = placeDtb.kernel.start.value + placeDtb.kernel.fileSize.value;
    expect(at('inside')).toBeGreaterThan(fileEnd);
    expect(at('inside')).toBeLessThan(placeDtb.kernel.end.value);
    expect(at('above')).toBeGreaterThan(placeDtb.kernel.end.value);
  });

  it('rejects a kernel file larger than the kernel and an address outside DRAM', () => {
    const big = structuredClone(placeDtb);
    big.kernel.fileSize.value = 0x1000_0000;
    expect(PlaceDtb.safeParse(big).success).toBe(false);
    const outside = structuredClone(placeDtb);
    if (outside.choices[0]) outside.choices[0].dtb.at.value = 0x1000;
    expect(PlaceDtb.safeParse(outside).success).toBe(false);
  });
});

describe('ReplayScenario', () => {
  const base = placeDtb.choices[0];

  it('keeps spans from one capture, in file order', () => {
    expect(ReplayScenario.safeParse(base).success).toBe(true);
    const other = { log: 'qemu/m10-dtb-missing.log', from: 41, to: 43 };
    expect(ReplayScenario.safeParse({ ...base, console: [...(base?.console ?? []), other] }).success).toBe(false);
    const backwards = [
      { log: 'qemu/m10-overlap.log', from: 45, to: 47 },
      { log: 'qemu/m10-overlap.log', from: 38, to: 40 },
    ];
    expect(ReplayScenario.safeParse({ ...base, console: backwards }).success).toBe(false);
  });
});
