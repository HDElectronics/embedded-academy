// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// Data for the ExceptionLevels figure: what svc, hvc, smc and eret do at each
// AArch64 exception level, and the reset levels the m01 lab captured in QEMU.

import { z } from 'zod';
import { CaptureRef, Source } from '../schema.ts';
import { ARM_ARM_A } from '../sources.ts';

export const ElLevel = z.enum(['EL0', 'EL1', 'EL2', 'EL3']);
export const ElOp = z.enum(['svc', 'hvc', 'smc', 'eret']);

/**
 * What one instruction does at one level. `up`: an exception is taken to the
 * higher level `to`. `return`: eret goes back to the level saved in SPSR_ELn.
 * `same`: the exception is taken to the current level. `undefined`: the
 * instruction is UNDEFINED there.
 */
export const ElRule = z
  .object({
    op: ElOp,
    at: ElLevel,
    result: z.enum(['up', 'return', 'same', 'undefined']),
    to: ElLevel.optional(),
    why: z.string().min(1),
    sources: z.array(Source).min(1),
  })
  .refine((r) => (r.result === 'up') === (r.to !== undefined), { message: '`to` is set exactly for `up` rules' });

export const ExceptionLevelsFigure = z.object({
  /** Where the core starts, and the sentence the figure opens with. */
  start: ElLevel,
  intro: z.string().min(1),
  /** The security state of each level on the path this figure follows. */
  worlds: z.record(ElLevel, z.enum(['secure', 'normal'])),
  ops: z.array(z.object({ op: ElOp, label: z.string().min(1) })).length(4),
  rules: z.array(ElRule).length(16),
  /** Templates: `{to}` and `{from}` become level names such as EL1. */
  entry: z.object({ text: z.string().min(1), sources: z.array(Source).min(1) }),
  eret: z.object({ text: z.string().min(1), sources: z.array(Source).min(1) }),
  undefinedNote: z.object({ text: z.string().min(1), sources: z.array(Source).min(1) }),
  /** Said when a move changes the security state, keyed by the new state. */
  worldChange: z.object({ secure: z.string().min(1), normal: z.string().min(1), sources: z.array(Source).min(1) }),
  assumptions: z.object({ text: z.string().min(1), sources: z.array(Source).min(1) }),
  /** Reset levels captured in the m01 lab. */
  reset: z.object({
    text: z.string().min(1),
    sources: z.array(Source).min(1),
    runs: z.array(z.object({ option: z.string().min(1), level: ElLevel, line: CaptureRef })).min(1),
  }),
});

export type ElLevel = z.infer<typeof ElLevel>;
export type ElOp = z.infer<typeof ElOp>;
export type ElRule = z.infer<typeof ElRule>;
export type ExceptionLevelsFigure = z.infer<typeof ExceptionLevelsFigure>;

const ARM_INSNS: Source = { ...ARM_ARM_A, section: 'A64 base instruction descriptions: SVC, HVC, SMC, ERET' };

const ARM_EXCEPTIONS: Source = {
  ...ARM_ARM_A,
  section: 'The AArch64 exception model: exception entry, exception return, ELR_ELx and SPSR_ELx',
};

const GUIDE: Source = {
  title: 'Learn the architecture: AArch64 Exception Model (102412, version 1.3)',
  url: 'https://developer.arm.com/documentation/102412/0103',
  section: 'Exception-generating instructions; Taking an exception; Returning from an exception',
};

const GUIDE_STATES: Source = { ...GUIDE, section: 'Security states; Changing Security state' };

const QEMU_RESET: Source = {
  title: 'QEMU 10.0 source: target/arm/cpu.c (arm_cpu_reset_hold) and hw/arm/virt.c (machvirt_init)',
  url: 'https://gitlab.com/qemu-project/qemu/-/blob/v10.0.0/target/arm/cpu.c',
};

const A72_TRM: Source = {
  title: 'Arm Cortex-A72 MPCore Processor Technical Reference Manual r0p1',
  url: 'https://developer.arm.com/documentation/100095/0001',
  section: '3.2.4 Rules for changing Exception state',
};

const RULE = [ARM_INSNS, GUIDE];
const LOG = 'qemu/m01-cortex-a72-reset-el.log';

const same = (op: ElOp, at: ElLevel) => ({
  op,
  at,
  result: 'same' as const,
  why: `At ${at}, ${op} is taken to ${at} itself: the core stays at this level. This figure follows only calls that go up.`,
  sources: RULE,
});

export const exceptionLevels: ExceptionLevelsFigure = ExceptionLevelsFigure.parse({
  start: 'EL0',
  intro: 'You are at EL0, in an application. Try svc #0, the way a program asks the kernel for a system call.',
  worlds: { EL0: 'normal', EL1: 'normal', EL2: 'normal', EL3: 'secure' },
  ops: [
    { op: 'svc', label: 'svc #0' },
    { op: 'hvc', label: 'hvc #0' },
    { op: 'smc', label: 'smc #0' },
    { op: 'eret', label: 'eret' },
  ],
  rules: [
    {
      op: 'svc',
      at: 'EL0',
      result: 'up',
      to: 'EL1',
      why: 'A program asks the OS kernel for a service.',
      sources: RULE,
    },
    same('svc', 'EL1'),
    same('svc', 'EL2'),
    same('svc', 'EL3'),
    {
      op: 'hvc',
      at: 'EL0',
      result: 'undefined',
      why: 'hvc is undefined at EL0. A program reaches the hypervisor only through the kernel.',
      sources: RULE,
    },
    {
      op: 'hvc',
      at: 'EL1',
      result: 'up',
      to: 'EL2',
      why: 'The kernel asks the hypervisor for a service.',
      sources: RULE,
    },
    same('hvc', 'EL2'),
    same('hvc', 'EL3'),
    {
      op: 'smc',
      at: 'EL0',
      result: 'undefined',
      why: 'smc is undefined at EL0. A program reaches the secure monitor only through the kernel.',
      sources: RULE,
    },
    {
      op: 'smc',
      at: 'EL1',
      result: 'up',
      to: 'EL3',
      why: 'The kernel calls the secure monitor at EL3, past EL2.',
      sources: RULE,
    },
    {
      op: 'smc',
      at: 'EL2',
      result: 'up',
      to: 'EL3',
      why: 'The hypervisor calls the secure monitor at EL3.',
      sources: RULE,
    },
    same('smc', 'EL3'),
    {
      op: 'eret',
      at: 'EL0',
      result: 'undefined',
      why: 'eret is undefined at EL0. There is no SPSR_EL0 or ELR_EL0 to return with.',
      sources: [ARM_INSNS],
    },
    ...(['EL1', 'EL2', 'EL3'] as const).map((at) => ({
      op: 'eret' as const,
      at,
      result: 'return' as const,
      why: `eret returns to the level saved in SPSR_${at}.`,
      sources: [ARM_INSNS, ARM_EXCEPTIONS],
    })),
  ],
  entry: {
    text: 'The core takes the exception to {to} and saves the way back: PSTATE in SPSR_{to}, the return address in ELR_{to}.',
    sources: [ARM_EXCEPTIONS, GUIDE],
  },
  eret: {
    text: 'The core restores PSTATE from SPSR_{from}, which holds {to}, and jumps to the address in ELR_{from}.',
    sources: [ARM_EXCEPTIONS, GUIDE],
  },
  undefinedNote: {
    text: 'Running it raises an Undefined Instruction exception, which the kernel at EL1 handles.',
    sources: [ARM_EXCEPTIONS],
  },
  worldChange: {
    secure: 'EL3 is always Secure: the core is now in the Secure state.',
    normal: 'SCR_EL3.NS is 1, so the core is back in the Non-secure state.',
    sources: [GUIDE_STATES],
  },
  assumptions: {
    text:
      'Rules for a core with all four levels, Non-secure below EL3, with HVC and SMC enabled ' +
      '(SCR_EL3.HCE is 1, SCR_EL3.SMD is 0) and no EL2 traps set.',
    sources: [ARM_INSNS],
  },
  reset: {
    text:
      'A core resets into the highest level it has. The m01 lab reset the same Cortex-A72 model in QEMU ' +
      'with three machine options. A real Cortex-A72 always has EL3, and resets there.',
    sources: [QEMU_RESET, A72_TRM],
    runs: [
      { option: 'virt', level: 'EL1', line: { log: LOG, from: 25, to: 25 } },
      { option: 'virt,secure=on', level: 'EL3', line: { log: LOG, from: 43, to: 43 } },
      { option: 'virt,virtualization=on', level: 'EL2', line: { log: LOG, from: 77, to: 77 } },
    ],
  },
});
