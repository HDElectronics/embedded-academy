// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { getBoard } from '@ea/boards';
import { readBoardLog } from '@ea/boards/node';
import { describe, expect, it } from 'vitest';
import { chainState } from './model.ts';
import { typingCadence } from './motion.ts';
import { esc, renderDetail, renderLine, renderMemory, renderRail, renderTabs } from './render.ts';
import { toChainBoard } from './types.ts';

const bbb = toChainBoard(getBoard('bbb'), readBoardLog(getBoard('bbb')));

describe('render', () => {
  it('escapes HTML', () => {
    expect(esc(`<a href="x">'&'</a>`)).toBe('&#60;a href=&#34;x&#34;&#62;&#39;&#38;&#39;&#60;/a&#62;');
  });

  it('shows systemd-style states on the rail', () => {
    const html = renderRail(bbb, chainState(bbb, 1));
    expect(html).toContain('[  OK  ]');
    expect(html).toContain('[ RUN  ]');
    expect(html).toContain('[ WAIT ]');
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
  });

  it('names the world in words, not colour alone', () => {
    const html = renderDetail(bbb, chainState(bbb, 0));
    expect(html).toContain('Secure side held by vendor ROM');
    expect(html).toContain('not yet verified');
    expect(html).toContain('Sources:');
  });

  it('prints formatted addresses in the memory map', () => {
    expect(renderMemory(bbb)).toContain('0x402F_0400');
    expect(renderMemory(bbb)).toContain('0x8000_0000 · 512 MB');
  });

  it('marks kernel timestamps and notes', () => {
    expect(renderLine('[    0.000000] Booting')).toBe('<span class="ts">[    0.000000]</span> Booting');
    expect(renderLine('(ROM is silent)')).toContain('class="note"');
  });

  it('selects exactly one tab', () => {
    const html = renderTabs([bbb, bbb], 1);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
  });
});

describe('typingCadence', () => {
  it('types short chunks at 30 characters per second', () => {
    expect(typingCadence(30)).toEqual({ chars: 1, interval: 33 });
  });

  it('speeds up so long chunks finish within 1.8 s', () => {
    const { chars, interval } = typingCadence(1800);
    expect(interval).toBe(16);
    expect((1800 / chars) * interval).toBeLessThanOrEqual(1800);
  });
});
