// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// Shared shapes for "pick a scenario, replay its capture" figures: each
// scenario is a real run, shown through spans of its captured console log.

import { z } from 'zod';
import { CaptureRef, Source } from '../schema.ts';

/**
 * A number the figure states outside console lines, with the captured line
 * that prints it. Tests check that the line holds the value in hex.
 */
export const CapturedNumber = z.object({
  value: z.number().int().nonnegative(),
  ref: CaptureRef,
});

/** What the learner sees at the end of a run, as a bracketed status word. */
export const OutcomeTag = z.enum(['OK', 'FAILED', 'SILENT', 'WARN', 'WAIT']);

export const Outcome = z.object({
  tag: OutcomeTag,
  /** A few words on what the console shows, such as `U-Boot refuses to boot`. */
  text: z.string().min(1),
});

export const ReplayScenario = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  /** The choice as the learner picks it. */
  title: z.string().min(1),
  /** One line under the title. */
  detail: z.string().min(1),
  /** Spans of one capture, in file order, that the figure replays. */
  console: z
    .array(CaptureRef)
    .min(1)
    .refine((spans) => spans.every((s) => s.log === spans[0]?.log), {
      message: 'every span of a scenario comes from the same capture',
    })
    .refine((spans) => spans.every((s, k) => k === 0 || s.from > (spans[k - 1]?.to ?? 0)), {
      message: 'spans must be in file order and must not overlap',
    }),
  outcome: Outcome,
  /** Why it happens, in the course voice. */
  explain: z.string().min(1),
  sources: z.array(Source).min(1),
});

export type CapturedNumber = z.infer<typeof CapturedNumber>;
export type OutcomeTag = z.infer<typeof OutcomeTag>;
export type Outcome = z.infer<typeof Outcome>;
export type ReplayScenario = z.infer<typeof ReplayScenario>;
