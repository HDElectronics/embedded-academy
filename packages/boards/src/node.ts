// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// Node-only helpers: read logs from the repository's logs/ folder at build time.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseStageLog, type StageLog } from './log.ts';
import { type Board, CaptureRef } from './schema.ts';

/**
 * The repository root: the nearest folder above `start` holding pnpm-workspace.yaml.
 * Found from the working directory, because bundlers move this file at build time.
 */
export function findRepoRoot(start = process.cwd()): string {
  let dir = start;
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`No pnpm-workspace.yaml above ${start}`);
    dir = parent;
  }
}

export function logsDir(): string {
  return process.env.EA_LOGS_DIR ?? join(findRepoRoot(), 'logs');
}

export function readBoardLog(board: Board, dir = logsDir()): StageLog {
  return parseStageLog(readFileSync(join(dir, board.log), 'utf8'));
}

/** A captured log: its `#` header fields and every raw line, index 0 being line 1. */
export interface Capture {
  /** Header fields (`# board: …`), in file order; `note` may repeat. */
  header: Record<string, string[]>;
  /** Number of header lines: the first body line is `headerLines + 1`. */
  headerLines: number;
  lines: string[];
}

export function readCapture(log: string, dir = logsDir()): Capture {
  const ref = CaptureRef.parse({ log, from: 1, to: 1 });
  const lines = readFileSync(join(dir, ref.log), 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  const header: Record<string, string[]> = {};
  let headerLines = 0;
  for (const line of lines) {
    if (!line.startsWith('#')) break;
    headerLines += 1;
    const field = /^# ([a-z][a-z-]*): (.*)$/.exec(line);
    if (!field) continue;
    const key = field[1] as string;
    header[key] = [...(header[key] ?? []), field[2] as string];
  }
  return { header, headerLines, lines };
}

/** The lines of `ref`, exactly as captured. Fails on a range outside the body. */
export function captureSpan(ref: CaptureRef, dir = logsDir()): string[] {
  const { log, from, to } = CaptureRef.parse(ref);
  const capture = readCapture(log, dir);
  if (from <= capture.headerLines) {
    throw new Error(`${log}:${from} is in the header; the body starts at line ${capture.headerLines + 1}`);
  }
  if (to > capture.lines.length) {
    throw new Error(`${log}:${to} is past the end; the file has ${capture.lines.length} lines`);
  }
  return capture.lines.slice(from - 1, to);
}
