// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { captureSpan, readCapture } from './node.ts';
import { CaptureRef } from './schema.ts';

function fixture(text: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'ea-capture-'));
  mkdirSync(join(dir, 'qemu'));
  writeFileSync(join(dir, 'qemu', 'demo.log'), text);
  return dir;
}

const LOG = [
  '# board: QEMU virt',
  '# note: first note',
  '# note: second note',
  '# verification: emulated',
  '',
  'NOTICE:  Booting Trusted Firmware',
  'U-Boot 2026.07',
  '# ... (3 lines cut)',
  'Starting kernel ...',
  '',
].join('\r\n');

describe('readCapture', () => {
  it('parses the header and keeps every raw line', () => {
    const capture = readCapture('qemu/demo.log', fixture(LOG));
    expect(capture.headerLines).toBe(4);
    expect(capture.header.board).toEqual(['QEMU virt']);
    expect(capture.header.note).toEqual(['first note', 'second note']);
    expect(capture.lines[5]).toBe('NOTICE:  Booting Trusted Firmware');
    expect(capture.lines).toHaveLength(9);
  });
});

describe('captureSpan', () => {
  const dir = fixture(LOG);

  it('returns an inclusive range of raw line numbers, cut markers included', () => {
    expect(captureSpan({ log: 'qemu/demo.log', from: 6, to: 9 }, dir)).toEqual([
      'NOTICE:  Booting Trusted Firmware',
      'U-Boot 2026.07',
      '# ... (3 lines cut)',
      'Starting kernel ...',
    ]);
  });

  it('refuses a span that reaches into the header', () => {
    expect(() => captureSpan({ log: 'qemu/demo.log', from: 4, to: 6 }, dir)).toThrow(
      /in the header; the body starts at line 5/,
    );
  });

  it('refuses a span past the end of the file', () => {
    expect(() => captureSpan({ log: 'qemu/demo.log', from: 8, to: 12 }, dir)).toThrow(
      /past the end; the file has 9 lines/,
    );
  });

  it('reads the real captures in logs/', () => {
    const [first] = captureSpan({ log: 'qemu/m10-chain-virt.log', from: 10, to: 10 });
    expect(first).toBe('NOTICE:  Booting Trusted Firmware');
  });
});

describe('CaptureRef', () => {
  it('only names logs under qemu/', () => {
    expect(CaptureRef.safeParse({ log: '../secrets.log', from: 1, to: 1 }).success).toBe(false);
    expect(CaptureRef.safeParse({ log: 'qemu/m10-chain-virt.log', from: 1, to: 1 }).success).toBe(true);
  });

  it('rejects a range that ends before it starts', () => {
    expect(CaptureRef.safeParse({ log: 'qemu/demo.log', from: 5, to: 4 }).success).toBe(false);
  });
});
