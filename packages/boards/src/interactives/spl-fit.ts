// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// Data for the SplFit figure: the BeagleBone Black SPL against the SRAM the
// AM335x boot ROM loads it into, with every size from the m04 lab capture.

import { z } from 'zod';
import { CaptureRef, Source } from '../schema.ts';
import { AM335X_TRM, UBOOT_AM335X } from '../sources.ts';

/** A size the m04 lab measured, and the captured lines that show it. */
const Measured = z.object({
  label: z.string().min(1),
  bytes: z.number().int().positive(),
  /** Lines of the capture that print this size. */
  evidence: CaptureRef,
  note: z.string().min(1),
  sources: z.array(Source),
});

export const SplFitFigure = z.object({
  board: z.literal('bbb'),
  /** What the capture built: config and U-Boot version, as its header states them. */
  build: z.object({ defconfig: z.string().min(1), version: z.string().min(1) }),
  /** The ROM download area. */
  limitA: Measured,
  /** CONFIG_SPL_MAX_SIZE, as the config spells it. */
  limitB: Measured.extend({ config: z.string().min(1) }),
  spl: Measured,
  image: Measured,
  /** Byte counts the learner can add to SPL. */
  steps: z.array(z.number().int().positive()).min(1),
  /** What the gap between the two limits holds. */
  scratch: z.object({ text: z.string().min(1), sources: z.array(Source).min(1) }),
  fits: z.object({ text: z.string().min(1), sources: z.array(Source).min(1) }),
  fails: z.object({ text: z.string().min(1), sources: z.array(Source).min(1) }),
  twoStages: z.object({ text: z.string().min(1), sources: z.array(Source).min(1) }),
});

export type SplFitFigure = z.infer<typeof SplFitFigure>;

const LOG = 'qemu/m04-spl-measure.log';

const TRM_AREA: Source = {
  ...AM335X_TRM,
  section: '26.1.4.2 Public RAM Memory Map; 26.1.9.2 Boot Image Location and Size',
};

const OMAP_H: Source = {
  title: 'U-Boot v2026.07 source: arch/arm/include/asm/arch-am33xx/omap.h',
  url: 'https://github.com/u-boot/u-boot/blob/v2026.07/arch/arm/include/asm/arch-am33xx/omap.h',
};

const SPL_KCONFIG: Source = {
  title: 'U-Boot v2026.07 source: common/spl/Kconfig',
  url: 'https://github.com/u-boot/u-boot/blob/v2026.07/common/spl/Kconfig',
  section: 'SPL_MAX_SIZE and its help text',
};

const TI_COMMON: Source = {
  title: 'U-Boot v2026.07 source: include/configs/ti_armv7_common.h',
  url: 'https://github.com/u-boot/u-boot/blob/v2026.07/include/configs/ti_armv7_common.h',
};

export const splFit: SplFitFigure = SplFitFigure.parse({
  board: 'bbb',
  build: { defconfig: 'am335x_evm_defconfig', version: 'U-Boot v2026.07' },
  limitA: {
    label: 'limit A: ROM download area',
    bytes: 111616,
    evidence: { log: LOG, from: 13, to: 16 },
    note: 'The most the AM335x boot ROM copies into SRAM.',
    sources: [TRM_AREA, OMAP_H],
  },
  limitB: {
    label: 'limit B: CONFIG_SPL_MAX_SIZE',
    config: 'CONFIG_SPL_MAX_SIZE=0x1b000',
    bytes: 110592,
    evidence: { log: LOG, from: 17, to: 20 },
    note: 'The most code and data U-Boot lets the linker put in SPL.',
    sources: [SPL_KCONFIG],
  },
  spl: {
    label: 'spl/u-boot-spl.bin',
    bytes: 110408,
    evidence: { log: LOG, from: 21, to: 23 },
    note: 'The SPL you built, as the lab measured it with GCC 14.2.0.',
    sources: [],
  },
  image: {
    label: 'u-boot.img',
    bytes: 1570776,
    evidence: { log: LOG, from: 32, to: 33 },
    note: 'The full U-Boot that SPL loads next.',
    sources: [],
  },
  steps: [64, 256, 1024],
  scratch: {
    text: 'scratch space U-Boot keeps',
    sources: [TI_COMMON, OMAP_H],
  },
  fits: {
    text: 'This margin is all the room you have to add features to SPL, such as another file system or a driver.',
    sources: [SPL_KCONFIG],
  },
  fails: {
    text: 'The linker checks code and data against limit B and refuses to build this SPL. Something must come out before anything else goes in.',
    sources: [SPL_KCONFIG],
  },
  twoStages: {
    text:
      'u-boot.img is far larger than the whole area the ROM can load, so it could never run where the ROM puts code. ' +
      'That is why there are two stages: SPL fits in SRAM, makes DRAM ready, then loads u-boot.img into DRAM.',
    sources: [TRM_AREA, UBOOT_AM335X],
  },
});
