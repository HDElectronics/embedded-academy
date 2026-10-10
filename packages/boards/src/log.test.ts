// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';
import { parseStageLog } from './log.ts';

describe('parseStageLog', () => {
  it('reads the header and splits stages', () => {
    const log = parseStageLog('# board: Test\n# captured: no\n\n@stage a\nline 1\n\n@stage b\nline 2\n');
    expect(log.header).toEqual({ board: 'Test', captured: 'no' });
    expect(log.stages.get('a')).toEqual(['line 1']);
    expect(log.stages.get('b')).toEqual(['line 2']);
  });

  it('keeps lines verbatim, including leading spaces and hashes after the header', () => {
    const log = parseStageLog('@stage a\n   indented\n# not a header here\n');
    expect(log.stages.get('a')).toEqual(['   indented', '# not a header here']);
  });

  it('accepts CRLF line endings', () => {
    expect(parseStageLog('@stage a\r\nx\r\n').stages.get('a')).toEqual(['x']);
  });

  it('rejects text before the first stage', () => {
    expect(() => parseStageLog('# board: x\nstray\n@stage a\n')).toThrow(/before the first @stage/);
  });

  it('rejects duplicate stages', () => {
    expect(() => parseStageLog('@stage a\nx\n@stage a\ny\n')).toThrow(/Duplicate/);
  });
});
