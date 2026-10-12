// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// The next-line quiz: the console so far, and real lines from the same
// capture to choose from. Only one of them comes next.

import { z } from 'zod';
import { CaptureRef, Source } from '../schema.ts';

const oneLine = (r: CaptureRef) => r.from === r.to;

export const PredictQuestion = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    /** The console so far. */
    context: CaptureRef,
    /** The next non-blank line after `context`. */
    answer: CaptureRef.refine(oneLine, { message: 'the answer is one line' }),
    /** Real lines from the same capture that do not come next. */
    distractors: z
      .array(CaptureRef.refine(oneLine, { message: 'a distractor is one line' }))
      .min(2)
      .max(3),
    /** Where the answer sits among the choices, so the order is fixed and varies. */
    answerAt: z.number().int().nonnegative(),
    /** Why the answer comes next, in a sentence or two. */
    why: z.string().min(1),
    sources: z.array(Source).min(1),
  })
  .refine((q) => q.answerAt <= q.distractors.length, { message: '`answerAt` is past the last choice' })
  .refine((q) => [q.answer, ...q.distractors].every((r) => r.log === q.context.log), {
    message: 'every choice comes from the same capture as the context',
  });

export const PredictLineData = z.object({
  log: CaptureRef.shape.log,
  questions: z.array(PredictQuestion).min(1),
});

export type PredictQuestion = z.infer<typeof PredictQuestion>;
export type PredictLineData = z.infer<typeof PredictLineData>;

/** The choices of `q` in display order: the distractors with the answer at `answerAt`. */
export function predictChoices(q: PredictQuestion): CaptureRef[] {
  const choices = [...q.distractors];
  choices.splice(q.answerAt, 0, q.answer);
  return choices;
}

const LOG = 'qemu/m10-chain-virt.log';
const at = (line: number): CaptureRef => ({ log: LOG, from: line, to: line });

const TFA_DESIGN: Source = {
  title: 'Trusted Firmware-A documentation (lts-v2.14.10): Firmware Design',
  url: 'https://trustedfirmware-a.readthedocs.io/en/lts-v2.14.10/design/firmware-design.html',
  section: 'Cold boot',
};

const UBOOT_BLOBLIST: Source = {
  title: 'U-Boot source (v2026.07): common/bloblist.c',
  url: 'https://source.denx.de/u-boot/u-boot/-/blob/v2026.07/common/bloblist.c',
  section: 'bloblist_init()',
};

const TFA_BUILD_OPTIONS: Source = {
  title: 'Trusted Firmware-A documentation (lts-v2.14.10): Build Options',
  url: 'https://trustedfirmware-a.readthedocs.io/en/lts-v2.14.10/getting_started/build-options.html',
  section: 'TRANSFER_LIST',
};

const LINUX_SETUP: Source = {
  title: 'Linux source (v6.18.55): arch/arm64/kernel/setup.c',
  url: 'https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/arch/arm64/kernel/setup.c?h=v6.18.55',
  section: 'smp_setup_processor_id()',
};

const BUILDROOT_INITTAB: Source = {
  title: 'Buildroot source (2026.02.3): package/busybox/inittab',
  url: 'https://gitlab.com/buildroot.org/buildroot/-/blob/2026.02.3/package/busybox/inittab',
};

/** Five questions over the full-chain capture from the m10 lab. */
export const predictLine: PredictLineData = PredictLineData.parse({
  log: LOG,
  questions: [
    {
      id: 'bl1-to-bl2',
      context: { log: LOG, from: 10, to: 13 },
      answer: at(14),
      distractors: [at(24), at(17)],
      answerAt: 1,
      why: 'BL1 has loaded BL2 and jumped to it, so the next voice is BL2, announcing its version.',
      sources: [TFA_DESIGN],
    },
    {
      id: 'bl2-to-bl31',
      context: { log: LOG, from: 13, to: 15 },
      answer: at(16),
      distractors: [at(17), at(24)],
      answerAt: 2,
      why: 'BL2 does not start BL31. It runs at Secure EL1 and cannot enter EL3, so it calls back into BL1 with an SMC, and BL1 enters BL31. That is why the line says BL1.',
      sources: [TFA_DESIGN],
    },
    {
      id: 'bl31-to-u-boot',
      context: { log: LOG, from: 16, to: 18 },
      answer: at(19),
      distractors: [at(24), at(72)],
      answerAt: 1,
      why: 'U-Boot speaks before its own banner. It looks for a transfer list from the previous stage and finds none, because this TF-A build keeps TRANSFER_LIST at its default, 0.',
      sources: [UBOOT_BLOBLIST, TFA_BUILD_OPTIONS],
    },
    {
      id: 'u-boot-to-linux',
      context: { log: LOG, from: 67, to: 71 },
      answer: at(72),
      distractors: [at(320), at(26)],
      answerAt: 1,
      why: "U-Boot has jumped to the kernel. The kernel's first line, at time zero, names the physical CPU it boots on.",
      sources: [LINUX_SETUP],
    },
    {
      id: 'linux-to-init',
      context: { log: LOG, from: 302, to: 304 },
      answer: at(305),
      distractors: [at(320), at(308)],
      answerAt: 2,
      why: "Init now runs as PID 1. Buildroot's inittab mounts /proc, then remounts the root file system read-write, and the kernel reports the remount. It had mounted the root read-only.",
      sources: [BUILDROOT_INITTAB],
    },
  ],
});
