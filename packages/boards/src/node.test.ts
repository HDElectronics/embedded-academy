// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBoard } from './index.ts';
import { findRepoRoot, logsDir } from './node.ts';

describe('findRepoRoot', () => {
  it('finds the folder holding pnpm-workspace.yaml from a nested folder', () => {
    const root = findRepoRoot(join(process.cwd(), 'packages', 'boards', 'src'));
    expect(existsSync(join(root, 'pnpm-workspace.yaml'))).toBe(true);
  });

  it('fails outside a workspace', () => {
    const outside = mkdtempSync(join(tmpdir(), 'ea-no-workspace-'));
    expect(() => findRepoRoot(outside)).toThrow(/No pnpm-workspace.yaml/);
  });
});

describe('logsDir', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('defaults to logs/ at the repository root', () => {
    vi.stubEnv('EA_LOGS_DIR', undefined);
    expect(logsDir()).toBe(join(findRepoRoot(), 'logs'));
  });

  it('honours EA_LOGS_DIR', () => {
    vi.stubEnv('EA_LOGS_DIR', '/tmp/captures');
    expect(logsDir()).toBe('/tmp/captures');
  });
});

describe('getBoard', () => {
  it('rejects an unknown board', () => {
    expect(() => getBoard('nope' as never)).toThrow(/Unknown board/);
  });
});
