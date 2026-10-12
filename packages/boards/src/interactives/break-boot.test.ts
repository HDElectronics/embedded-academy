// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';
import { captureSpan, readCapture } from '../node.ts';
import { BreakRun, bootargsFrom, breakBoot } from './break-boot.ts';

const run = (id: string) => {
  const r = breakBoot.runs.find((x) => x.id === id);
  if (!r) throw new Error(`no run ${id}`);
  return r;
};
const args = (id: string) => bootargsFrom(captureSpan(run(id).bootargs)[0] ?? '');
const text = (id: string) =>
  run(id)
    .console.flatMap((ref) => captureSpan(ref))
    .join('\n');

describe('bootargsFrom', () => {
  it('reads U-Boot’s setenv, printenv output and QEMU’s -append', () => {
    expect(bootargsFrom('=> setenv bootargs console=ttyS0 root=/dev/vda rootwait')).toEqual([
      'console=ttyS0',
      'root=/dev/vda',
      'rootwait',
    ]);
    expect(bootargsFrom('bootargs=console=ttyAMA0 root=/dev/vda')).toEqual(['console=ttyAMA0', 'root=/dev/vda']);
    expect(bootargsFrom('qemu-system-aarch64 -append "earlycon" -m 1024')).toEqual(['earlycon']);
    expect(bootargsFrom('=> printenv fdtcontroladdr')).toBeUndefined();
  });

  it('rejects a bootargs span longer than one line', () => {
    const bad = { ...run('reference'), bootargs: { log: 'qemu/m10-chain-virt.log', from: 44, to: 45 } };
    expect(BreakRun.safeParse(bad).success).toBe(false);
  });
});

describe('breakBoot data', () => {
  it('takes each run’s command line from its own capture', () => {
    expect(args('reference')).toEqual(['console=ttyAMA0', 'root=/dev/vda', 'rootwait']);
    expect(args('console-ttys0')).toEqual(['console=ttyS0', 'root=/dev/vda', 'rootwait']);
    expect(args('earlycon')).toEqual(['console=ttyS0', 'earlycon', 'root=/dev/vda', 'rootwait']);
    expect(args('root-vdb')).toEqual(['console=ttyAMA0', 'root=/dev/vdb']);
    expect(args('rootwait')).toEqual(['console=ttyAMA0', 'root=/dev/vdb', 'rootwait']);
  });

  it('checks the reference arguments against what the kernel printed', () => {
    const line = captureSpan(run('reference').bootargs)[0] ?? '';
    const kernel = readCapture(run('reference').bootargs.log).lines.find((l) => l.includes('Kernel command line:'));
    expect(kernel).toContain(`Kernel command line: ${line.replace('bootargs=', '')}`);
  });

  it('replays the last lines that show each symptom', () => {
    expect(text('reference')).toContain('buildroot login:');
    expect(text('console-ttys0')).toContain('Starting kernel ...');
    expect(text('console-ttys0')).not.toContain('Booting Linux');
    expect(text('earlycon')).toContain("earlycon: pl11 at MMIO 0x0000000009000000 (options '')");
    expect(text('earlycon')).toContain('Warning: unable to open an initial console.');
    expect(text('earlycon')).toContain('ttyAMA0 at MMIO 0x9000000');
    expect(text('root-vdb')).toContain(
      'Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)',
    );
    expect(text('rootwait')).toContain('Waiting for root device /dev/vdb...');
    expect(text('rootwait')).not.toContain('Kernel panic');
  });

  it('runs a machine with vda as its only virtio disk', () => {
    const lines = readCapture(run('root-vdb').bootargs.log).lines;
    expect(lines.filter((l) => l.includes('512-byte logical blocks'))).toHaveLength(1);
    expect(text('root-vdb')).toMatch(/fe00 +61440 vda/);
  });
});
