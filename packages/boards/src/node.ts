// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// Node-only helpers: read logs from the repository's logs/ folder at build time.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseStageLog, type StageLog } from './log.ts';
import type { Board } from './schema.ts';

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
