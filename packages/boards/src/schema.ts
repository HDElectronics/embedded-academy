// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { z } from 'zod';

/** Where a fact comes from. Preferred: vendor TRM, upstream docs, upstream source. */
export const Source = z.object({
  title: z.string().min(1),
  url: z.url().optional(),
  section: z.string().min(1).optional(),
});

/** How a fact, command or log was checked. Only a person with the board may set `hardware`. */
export const Verification = z.enum(['unverified', 'emulated', 'hardware']);

/**
 * Who owns the CPU at this stage.
 * `firmware`: no Arm world yet (VideoCore, boot ROM before any Arm security state applies).
 * `secure` / `normal`: the TrustZone worlds.
 * `vendor`: the vendor ROM keeps the secure side; the stage runs in a state the vendor chose.
 */
export const World = z.enum(['firmware', 'secure', 'normal', 'vendor']);

export const Region = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  kind: z.enum(['rom', 'sram', 'dram']),
  /** Physical base address, when the source states it. */
  base: z.number().int().nonnegative().optional(),
  /** Size in bytes, when the source states it. */
  size: z.number().int().positive().optional(),
  note: z.string().min(1).optional(),
  sources: z.array(Source).min(1),
});

/** An image a stage copies into memory for a later stage. */
export const Load = z.object({
  /** The image as named on disk or in the container that holds it. */
  file: z.string().min(1),
  /** Where it is read from: a device, partition or another region. */
  from: z.string().min(1),
  /** Region id it is copied into. */
  to: z.string(),
  /** Load address, when the source states it. */
  address: z.number().int().nonnegative().optional(),
  /** `top`: copied to the top of the region, as U-Boot does when it relocates itself. */
  place: z.enum(['top']).optional(),
  sources: z.array(Source).min(1),
});

/**
 * Where the Arm core runs a stage on the privilege ladder: an exception level
 * (Armv8-A) or privilege level (Armv7-A), and the security state.
 */
export const Privilege = z.object({
  level: z.enum(['EL3', 'EL2', 'EL1', 'EL0', 'PL2', 'PL1', 'PL0']),
  world: z.enum(['secure', 'normal']),
});

export const Stage = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  /** The artifact that runs, as named on disk or in the image. */
  file: z.string().min(1),
  /** Where the artifact is loaded from. */
  from: z.string().min(1),
  /** Region id where the stage executes. */
  region: z.string(),
  core: z.string().min(1),
  /** Exception level or processor mode, as the architecture names it. */
  level: z.string().min(1),
  world: World,
  /** Omit when no Arm core runs the stage, or when the source does not state the security state. */
  privilege: Privilege.optional(),
  does: z.array(z.string().min(1)).min(1).max(4),
  /** Images this stage copies into memory, in order. */
  loads: z.array(Load).max(6).optional(),
  sources: z.array(Source).min(1),
  verification: Verification,
});

export const Board = z.object({
  id: z.enum(['rpi4', 'bbb', 'stm32mp157']),
  name: z.string().min(1),
  soc: z.string().min(1),
  cpu: z.string().min(1),
  arch: z.enum(['armv7-a', 'armv8-a']),
  summary: z.string().min(1),
  regions: z.array(Region).min(1),
  stages: z.array(Stage).min(2),
  /** Log file under logs/, split into chunks by `@stage <id>` lines. */
  log: z.string().regex(/^[a-z0-9/_-]+\.log$/),
});

export type Source = z.infer<typeof Source>;
export type Verification = z.infer<typeof Verification>;
export type World = z.infer<typeof World>;
export type Load = z.infer<typeof Load>;
export type Privilege = z.infer<typeof Privilege>;
export type Region = z.infer<typeof Region>;
export type Stage = z.infer<typeof Stage>;
export type Board = z.infer<typeof Board>;
