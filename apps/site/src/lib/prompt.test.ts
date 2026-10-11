// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';
import { promptPath } from './prompt.ts';

const pages = new Set(['/', '/courses/linux-boot-arm/']);
const hasPage = (href: string) => pages.has(href);

describe('promptPath', () => {
  it('shows only ~ on the home page, as the current page', () => {
    expect(promptPath('/', hasPage)).toEqual([{ label: '~', href: undefined, current: true, far: false }]);
  });

  it('links only to segments that have a page, never to the current one', () => {
    const segments = promptPath('/courses/linux-boot-arm/00-orientation/01-the-boot-chain-at-a-glance/', hasPage);
    expect(segments.map((s) => [s.label, s.href ?? null, s.current])).toEqual([
      ['~', '/', false],
      ['courses', null, false],
      ['linux-boot-arm', '/courses/linux-boot-arm/', false],
      ['00-orientation', null, false],
      ['01-the-boot-chain-at-a-glance', null, true],
    ]);
  });

  it('marks all but the last two directories as far, for phones to fold', () => {
    const segments = promptPath('/courses/linux-boot-arm/00-orientation/01-x/', hasPage);
    expect(segments.filter((s) => s.far).map((s) => s.label)).toEqual(['courses', 'linux-boot-arm']);
  });
});
