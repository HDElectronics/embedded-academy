// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// The hand-off relay: each stage of the QEMU virt chain, what it loaded and
// what it passed to the next stage. Console lines are spans of captured logs.

import { z } from 'zod';
import { CaptureRef, Source } from '../schema.ts';
import { ARM_ARM_A } from '../sources.ts';

/** An image a stage put in memory, read from the console line that reports it. */
export const RelayLoad = z.object({
  image: z.string().min(1),
  /** First address, as the line states it. */
  at: z.number().int().nonnegative(),
  /** End address, when the line states one. */
  end: z.number().int().positive().optional(),
  /** Size in bytes, when the line states one instead of an end. */
  size: z.number().int().positive().optional(),
  /** The line or lines that state the address. */
  ref: CaptureRef,
});

export const RelayStep = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  level: z.enum(['EL3', 'EL1', 'EL0']),
  world: z.enum(['secure', 'normal']),
  /** Console output of this stage, in order. Gaps between spans are shown as cut. */
  console: z.array(CaptureRef).min(1),
  loads: z.array(RelayLoad),
  handoff: z.object({
    /** What the next stage receives, in a few words. */
    summary: z.string().min(1),
    /** The lines that show it. */
    ref: CaptureRef,
    /** Set when `ref` comes from a different run than the console. */
    note: z.string().min(1).optional(),
  }),
  explain: z.string().min(1),
  sources: z.array(Source).min(1),
});

export const HandoffRelayData = z.object({
  steps: z.array(RelayStep).min(2),
});

export type RelayLoad = z.infer<typeof RelayLoad>;
export type RelayStep = z.infer<typeof RelayStep>;
export type HandoffRelayData = z.infer<typeof HandoffRelayData>;

const TFA = 'qemu/m05-tfa-virt-debug.log';
const CHAIN = 'qemu/m10-chain-virt.log';
const GDB = 'qemu/m10-gdb-start-kernel.log';

const TFA_DESIGN: Source = {
  title: 'Trusted Firmware-A documentation (lts-v2.14.10): Firmware Design',
  url: 'https://trustedfirmware-a.readthedocs.io/en/lts-v2.14.10/design/firmware-design.html',
  section: 'Cold boot; BL33 (Non-trusted Firmware) execution',
};

const TFA_IMAGE_IDS: Source = {
  title: 'Trusted Firmware-A source (lts-v2.14.10): include/export/common/tbbr/tbbr_img_def_exp.h',
  url: 'https://github.com/ARM-software/arm-trusted-firmware/blob/lts-v2.14.10/include/export/common/tbbr/tbbr_img_def_exp.h',
};

const TFA_QEMU_DEF: Source = {
  title: 'Trusted Firmware-A source (lts-v2.14.10): plat/qemu/qemu/include/platform_def.h',
  url: 'https://github.com/ARM-software/arm-trusted-firmware/blob/lts-v2.14.10/plat/qemu/qemu/include/platform_def.h',
};

const ARM_SPSR: Source = { ...ARM_ARM_A, section: 'SPSR_EL3, the M[3:0] field' };

const QEMU_VIRT: Source = {
  title: 'QEMU documentation (v10.0.0): Arm virt board',
  url: 'https://gitlab.com/qemu-project/qemu/-/blob/v10.0.0/docs/system/arm/virt.rst',
  section: 'the virtualization option',
};

const UBOOT_BOOTI: Source = {
  title: 'U-Boot documentation (v2026.07): booti command',
  url: 'https://docs.u-boot.org/en/v2026.07/usage/cmd/booti.html',
};

const ARM64_BOOTING: Source = {
  title: 'Linux kernel documentation (v6.18): Booting AArch64 Linux',
  url: 'https://www.kernel.org/doc/html/v6.18/arch/arm64/booting.html',
  section: 'Call the kernel image',
};

const LINUX_INIT: Source = {
  title: 'Linux source (v6.18.55): init/main.c',
  url: 'https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/init/main.c?h=v6.18.55',
  section: 'kernel_init() and run_init_process()',
};

const BUILDROOT_INITTAB: Source = {
  title: 'Buildroot source (2026.02.3): package/busybox/inittab',
  url: 'https://gitlab.com/buildroot.org/buildroot/-/blob/2026.02.3/package/busybox/inittab',
};

const ARM_EL0: Source = { ...ARM_ARM_A, section: 'Exception levels' };

/** The QEMU virt chain with TrustZone on, from BL1 to the login prompt. */
export const handoffRelay: HandoffRelayData = HandoffRelayData.parse({
  steps: [
    {
      id: 'bl1',
      name: 'BL1',
      level: 'EL3',
      world: 'secure',
      console: [
        { log: TFA, from: 9, to: 12 },
        { log: TFA, from: 26, to: 31 },
      ],
      loads: [{ image: 'BL2', at: 0xe05b000, end: 0xe063204, ref: { log: TFA, from: 27, to: 28 } }],
      handoff: {
        summary: 'Entry point 0x0E05_B000, SPSR 0x3C5: Secure EL1',
        ref: { log: TFA, from: 29, to: 31 },
      },
      explain:
        'BL1 starts at EL3 and copies BL2 into secure SRAM. It enters BL2 at its first byte. SPSR 0x3C5 selects EL1, so BL2 runs one level lower, still in the secure world.',
      sources: [TFA_DESIGN, TFA_QEMU_DEF, ARM_SPSR],
    },
    {
      id: 'bl2',
      name: 'BL2',
      level: 'EL1',
      world: 'secure',
      console: [
        { log: TFA, from: 32, to: 33 },
        { log: TFA, from: 35, to: 43 },
      ],
      loads: [
        { image: 'BL31', at: 0xe090000, end: 0xe09f0c7, ref: { log: TFA, from: 36, to: 37 } },
        { image: 'U-Boot (BL33)', at: 0x60000000, end: 0x6016e9b0, ref: { log: TFA, from: 39, to: 40 } },
      ],
      handoff: {
        summary: 'Entry point 0x0E09_0000, SPSR 0x3CD: EL3',
        ref: { log: TFA, from: 41, to: 43 },
      },
      explain:
        'BL2 loads image 3, BL31, and image 5, BL33. From Secure EL1 it cannot enter EL3 itself, so it calls back into BL1 with an SMC. That is why the next line says BL1: BL1, not BL2, enters BL31.',
      sources: [TFA_DESIGN, TFA_IMAGE_IDS, ARM_SPSR],
    },
    {
      id: 'bl31',
      name: 'BL31',
      level: 'EL3',
      world: 'secure',
      console: [
        { log: TFA, from: 44, to: 45 },
        { log: TFA, from: 61, to: 63 },
      ],
      loads: [],
      handoff: {
        summary: 'Entry point 0x6000_0000, SPSR 0x3C5: non-secure EL1',
        ref: { log: TFA, from: 61, to: 63 },
      },
      explain:
        'BL31 leaves EL3 for the normal world and enters U-Boot. TF-A enters BL33 at the highest level available, and this machine runs without EL2, so SPSR 0x3C5 selects EL1. BL31 stays resident in EL3 to answer SMCs.',
      sources: [TFA_DESIGN, QEMU_VIRT, ARM_SPSR],
    },
    {
      id: 'u-boot',
      name: 'U-Boot',
      level: 'EL1',
      world: 'normal',
      console: [
        { log: CHAIN, from: 19, to: 24 },
        { log: CHAIN, from: 26, to: 27 },
        { log: CHAIN, from: 40, to: 42 },
        { log: CHAIN, from: 63, to: 70 },
      ],
      loads: [
        { image: 'Linux Image', at: 0x40400000, size: 0x276fa00, ref: { log: CHAIN, from: 42, to: 42 } },
        { image: 'Device Tree', at: 0x7d622000, end: 0x7d627154, ref: { log: CHAIN, from: 67, to: 67 } },
      ],
      handoff: {
        summary: 'x0 = Device Tree address, x1 = x2 = x3 = 0',
        ref: { log: GDB, from: 14, to: 18 },
        note: 'Registers from a separate run under GDB, logs/qemu/m10-gdb-start-kernel.log. In that run U-Boot put the Device Tree at 0x7D5F_B000; in the console run, at 0x7D62_2000.',
      },
      explain:
        'U-Boot loads the kernel at 0x4040_0000, copies the Device Tree to a fresh place and jumps to the kernel. The arm64 boot protocol asks for the Device Tree address in x0 and zero in x1 to x3.',
      sources: [UBOOT_BOOTI, ARM64_BOOTING],
    },
    {
      id: 'linux',
      name: 'Linux',
      level: 'EL1',
      world: 'normal',
      console: [
        { log: CHAIN, from: 72, to: 72 },
        { log: CHAIN, from: 76, to: 76 },
        { log: CHAIN, from: 106, to: 106 },
        { log: CHAIN, from: 150, to: 150 },
        { log: CHAIN, from: 300, to: 304 },
      ],
      loads: [],
      handoff: {
        summary: '/sbin/init runs as PID 1',
        ref: { log: CHAIN, from: 304, to: 304 },
      },
      explain:
        'The kernel mounts /dev/vda read-only as the root file system, then starts /sbin/init, the first program it looks for, as process 1 at EL0.',
      sources: [LINUX_INIT, ARM_EL0],
    },
    {
      id: 'pid-1',
      name: 'PID 1',
      level: 'EL0',
      world: 'normal',
      console: [{ log: CHAIN, from: 305, to: 321 }],
      loads: [],
      handoff: {
        summary: 'A login prompt: the boot is over',
        ref: { log: CHAIN, from: 320, to: 321 },
      },
      explain:
        "Init follows Buildroot's inittab: it remounts the root file system read-write, which the kernel reports, then runs the start-up scripts through /etc/init.d/rcS. The boot ends at the login prompt; in the lab you typed root.",
      sources: [BUILDROOT_INITTAB, ARM_EL0],
    },
  ],
});
