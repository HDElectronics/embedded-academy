// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// PlaceDtb: the kernel sits in DRAM; the learner picks where the Device Tree
// goes and reads U-Boot's real answer. Every address comes from a capture.

import { z } from 'zod';
import type { Source } from '../schema.ts';
import { CapturedNumber, ReplayScenario } from './replay.ts';

const UBOOT_BOOTM: Source = {
  title: 'U-Boot source (v2026.07): boot/bootm.c, boot/image-fdt.c and arch/arm/lib/bootm.c',
  url: 'https://source.denx.de/u-boot/u-boot/-/blob/v2026.07/boot/bootm.c',
};

const UBOOT_IMAGE: Source = {
  title: 'U-Boot source (v2026.07): arch/arm/lib/bootm-fdt.c and arch/arm/lib/image.c',
  url: 'https://source.denx.de/u-boot/u-boot/-/blob/v2026.07/arch/arm/lib/bootm-fdt.c',
};

const ARM64_BOOTING: Source = {
  title: 'Linux kernel documentation (v6.18): Booting AArch64 Linux',
  url: 'https://www.kernel.org/doc/html/v6.18/arch/arm64/booting.html',
  section: 'Call the kernel image (image_size)',
};

const UBOOT_BOOTI: Source = {
  title: 'U-Boot documentation (v2026.07): booti command',
  url: 'https://docs.u-boot.org/en/v2026.07/usage/cmd/booti.html',
};

const RPI4_DTS: Source = {
  title: 'Linux source (v6.18.55): arch/arm/boot/dts/broadcom/bcm2711-rpi-4-b.dts',
  url: 'https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/arch/arm/boot/dts/broadcom/bcm2711-rpi-4-b.dts?h=v6.18.55',
};

/** What the address handed to `booti` holds. */
export const DtbHolds = z.enum(['tree', 'nothing', 'foreign']);

export const DtbChoice = ReplayScenario.extend({
  dtb: z.object({ at: CapturedNumber, holds: DtbHolds }),
});

export const PlaceDtb = z
  .object({
    /** The machine's DRAM, as the kernel reports it. */
    dram: z.object({ start: CapturedNumber, end: CapturedNumber }),
    kernel: z.object({
      /** `kernel_addr_r`, where `qfw load` put the `Image` file. */
      start: CapturedNumber,
      /** Size of the `Image` file. */
      fileSize: CapturedNumber,
      /** End of the kernel with its BSS (`image_size`), as U-Boot's overlap check prints it. */
      end: CapturedNumber,
    }),
    choices: z.array(DtbChoice).min(2),
  })
  .refine((p) => p.kernel.start.value + p.kernel.fileSize.value <= p.kernel.end.value, {
    message: 'the Image file must end inside the kernel',
  })
  .refine(
    (p) =>
      [p.kernel.start, p.kernel.end, ...p.choices.map((c) => c.dtb.at)].every(
        (n) => n.value >= p.dram.start.value && n.value <= p.dram.end.value,
      ),
    { message: 'every address must lie in DRAM' },
  );

export type DtbChoice = z.infer<typeof DtbChoice>;
export type PlaceDtb = z.infer<typeof PlaceDtb>;

const OVERLAP = 'qemu/m10-overlap.log';
const MISSING = 'qemu/m10-dtb-missing.log';
const WRONG = 'qemu/m10-dtb-wrong.log';

export const placeDtb: PlaceDtb = PlaceDtb.parse({
  dram: {
    start: { value: 0x4000_0000, ref: { log: OVERLAP, from: 77, to: 77 } },
    end: { value: 0x7fff_ffff, ref: { log: OVERLAP, from: 77, to: 77 } },
  },
  kernel: {
    start: { value: 0x4040_0000, ref: { log: OVERLAP, from: 40, to: 40 } },
    fileSize: { value: 0x276_fa00, ref: { log: OVERLAP, from: 40, to: 40 } },
    end: { value: 0x42c3_0000, ref: { log: OVERLAP, from: 47, to: 47 } },
  },
  choices: [
    {
      id: 'inside',
      title: 'Inside the kernel',
      detail: 'Past the end of the Image file, but not past the kernel.',
      dtb: { at: { value: 0x42b8_0000, ref: { log: OVERLAP, from: 41, to: 41 } }, holds: 'tree' },
      console: [{ log: OVERLAP, from: 38, to: 47 }],
      outcome: { tag: 'FAILED', text: 'U-Boot refuses to boot' },
      explain:
        'The tree sits past the end of the `Image` file but inside `image_size`, which also covers the kernel’s BSS. U-Boot reads `image_size` and refuses to start a kernel that would overwrite the tree. Load the dtb above the kernel’s end.',
      sources: [UBOOT_BOOTM, UBOOT_IMAGE, ARM64_BOOTING],
    },
    {
      id: 'above',
      title: 'Above the kernel',
      detail: 'The same tree, copied clear of the kernel’s end.',
      dtb: { at: { value: 0x4800_0000, ref: { log: OVERLAP, from: 50, to: 50 } }, holds: 'tree' },
      console: [{ log: OVERLAP, from: 50, to: 62 }],
      outcome: { tag: 'OK', text: 'the kernel starts' },
      explain:
        'The tree lies clear of the kernel, so the check passes. Before the jump, U-Boot copies the tree once more, near the top of RAM, and hands the kernel that copy: read the `Loading Device Tree to` line.',
      sources: [UBOOT_BOOTM, UBOOT_BOOTI],
    },
    {
      id: 'nothing',
      title: 'An address with no tree',
      detail: 'Nothing was loaded there in this run.',
      dtb: { at: { value: 0x4800_0000, ref: { log: MISSING, from: 41, to: 41 } }, holds: 'nothing' },
      console: [{ log: MISSING, from: 38, to: 43 }],
      outcome: { tag: 'FAILED', text: 'no valid Device Tree' },
      explain:
        'U-Boot looks for a Device Tree at the address you gave, finds none, and returns to the prompt. Nothing reaches the kernel.',
      sources: [UBOOT_BOOTM, UBOOT_BOOTI],
    },
    {
      id: 'foreign',
      title: 'Another board’s tree',
      detail: 'bcm2711-rpi-4-b.dtb, the Raspberry Pi 4 tree.',
      dtb: { at: { value: 0x4800_0000, ref: { log: WRONG, from: 45, to: 45 } }, holds: 'foreign' },
      console: [{ log: WRONG, from: 45, to: 60 }],
      outcome: { tag: 'SILENT', text: 'nothing after Starting kernel' },
      explain:
        'U-Boot accepts any valid tree, even one written for another board. This one describes a Raspberry Pi 4, so the kernel starts on the wrong hardware description and nothing reaches this machine’s console.',
      sources: [RPI4_DTS, UBOOT_BOOTI],
    },
  ],
});
