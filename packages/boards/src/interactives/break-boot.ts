// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// BreakBoot: real runs of the m10 lab machine, each with one kernel argument
// changed. The command line of each run comes from its own capture.

import { z } from 'zod';
import { CaptureRef, type Source } from '../schema.ts';
import { ReplayScenario } from './replay.ts';

const KERNEL_PARAMS: Source = {
  title: 'Linux kernel documentation (v6.18): The kernel’s command-line parameters',
  url: 'https://www.kernel.org/doc/html/v6.18/admin-guide/kernel-parameters.html',
  section: 'console=, earlycon=, root=, rootwait',
};

const OF_BASE: Source = {
  title: 'Linux source (v6.18.55): drivers/of/base.c',
  url: 'https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/drivers/of/base.c?h=v6.18.55',
  section: 'of_console_check()',
};

const PL011: Source = {
  title: 'Linux source (v6.18.55): drivers/tty/serial/earlycon.c and drivers/tty/serial/amba-pl011.c',
  url: 'https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/drivers/tty/serial/earlycon.c?h=v6.18.55',
};

const INIT: Source = {
  title: 'Linux source (v6.18.55): init/main.c and init/do_mounts.c',
  url: 'https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/init/do_mounts.c?h=v6.18.55',
};

/**
 * The kernel arguments in a captured line: U-Boot's `=> setenv bootargs …`,
 * the `bootargs=…` that `printenv` prints, or QEMU's `-append "…"`.
 */
export function bootargsFrom(line: string): string[] | undefined {
  const m = /^=> setenv bootargs (.*)$/.exec(line) ?? /^bootargs=(.*)$/.exec(line) ?? /-append "([^"]*)"/.exec(line);
  return m?.[1]?.trim().split(/\s+/);
}

export const BreakRun = ReplayScenario.extend({
  /** The one captured line that sets or prints this run's kernel arguments. */
  bootargs: CaptureRef.refine((r) => r.from === r.to, { message: 'bootargs is one line' }),
});

export const BreakBoot = z.object({
  /** The first run is the reference the others are compared with. */
  runs: z.array(BreakRun).min(2),
});

export type BreakRun = z.infer<typeof BreakRun>;
export type BreakBoot = z.infer<typeof BreakBoot>;

const log = (name: string) => `qemu/m10-${name}.log`;

export const breakBoot: BreakBoot = BreakBoot.parse({
  runs: [
    {
      id: 'reference',
      title: 'Nothing changed',
      detail: 'The reference run of the lab machine.',
      bootargs: { log: log('chain-virt'), from: 44, to: 44 },
      console: [
        { log: log('chain-virt'), from: 178, to: 178 },
        { log: log('chain-virt'), from: 304, to: 304 },
        { log: log('chain-virt'), from: 320, to: 321 },
      ],
      outcome: { tag: 'OK', text: 'login prompt' },
      explain:
        'The reference run. The PL011 UART is the console, `ttyAMA0`; the kernel mounts `/dev/vda`, runs `/sbin/init`, and a login prompt follows.',
      sources: [KERNEL_PARAMS, PL011],
    },
    {
      id: 'console-ttys0',
      title: 'Name the wrong console',
      detail: 'A UART name this machine does not have.',
      bootargs: { log: log('console-ttys0'), from: 41, to: 41 },
      console: [{ log: log('console-ttys0'), from: 41, to: 51 }],
      outcome: { tag: 'SILENT', text: 'nothing after Starting kernel' },
      explain:
        '`console=` names a device that no driver registered: the PL011 driver calls this UART `ttyAMA0`. Once `console=` is set, the kernel no longer falls back to the UART that `stdout-path` names, so it prints nowhere you can see.',
      sources: [OF_BASE, PL011, KERNEL_PARAMS],
    },
    {
      id: 'earlycon',
      title: 'Add earlycon',
      detail: 'The same wrong console, with an early one added.',
      bootargs: { log: log('console-earlycon'), from: 41, to: 41 },
      console: [
        { log: log('console-earlycon'), from: 57, to: 58 },
        { log: log('console-earlycon'), from: 87, to: 87 },
        { log: log('console-earlycon'), from: 158, to: 158 },
        { log: log('console-earlycon'), from: 279, to: 279 },
        { log: log('console-earlycon'), from: 288, to: 290 },
      ],
      outcome: { tag: 'WARN', text: 'kernel log, but no login prompt' },
      explain:
        'With no options, `earlycon` takes the UART from `stdout-path` and prints the kernel log from the start. The log names the real console, `ttyAMA0`, and warns that init has no console: the kernel runs, and `console=` is the bug.',
      sources: [KERNEL_PARAMS, INIT],
    },
    {
      id: 'root-vdb',
      title: 'Name a disk that is not there',
      detail: 'The machine has one virtio disk, vda.',
      bootargs: { log: log('root-panic'), from: 41, to: 41 },
      console: [
        { log: log('root-panic'), from: 279, to: 283 },
        { log: log('root-panic'), from: 293, to: 293 },
        { log: log('root-panic'), from: 313, to: 313 },
      ],
      outcome: { tag: 'FAILED', text: 'kernel panic' },
      explain:
        'The kernel lists the block devices it has, and `vdb` is not among them. It cannot mount a root file system, so it panics.',
      sources: [INIT, KERNEL_PARAMS],
    },
    {
      id: 'rootwait',
      title: 'Wait for that disk',
      detail: 'The same wrong disk, with rootwait.',
      bootargs: { log: log('root-wait'), from: 41, to: 41 },
      console: [
        { log: log('root-wait'), from: 277, to: 279 },
        { log: log('root-wait'), from: 283, to: 283 },
      ],
      outcome: { tag: 'WAIT', text: 'waits for the disk, with no time limit' },
      explain:
        '`rootwait` makes the kernel wait for the root device with no time limit. It is meant for devices detected late, such as USB and MMC devices; here `vdb` never appears, so the boot waits instead of panicking. `rootwait=` takes a limit in seconds.',
      sources: [KERNEL_PARAMS],
    },
  ],
});
