// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT
// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineCourseMap, type EaCourseMap } from './course-map.ts';

async function mount(): Promise<EaCourseMap> {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }) as MediaQueryList);
  defineCourseMap();
  document.body.innerHTML = `
    <ea-course-map>
      <button data-module="m00" aria-pressed="true">m00</button>
      <div data-part="line">
        <span data-node="m02"></span><button data-module="m02" aria-pressed="false">m02</button>
        <span data-part="marker" hidden></span>
      </div>
      <section data-panel="m00">m00</section>
      <section data-panel="m02" hidden>m02</section>
    </ea-course-map>`;
  await Promise.resolve();
  const el = document.querySelector('ea-course-map');
  if (!el) throw new Error('not mounted');
  return el as EaCourseMap;
}

const q = (s: string) => document.querySelector<HTMLElement>(s);

describe('<ea-course-map>', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('starts on the module the server marked as pressed, without a marker off the line', async () => {
    const el = await mount();
    expect(el.selected).toBe('m00');
    expect(q('[data-part="marker"]')?.hidden).toBe(true);
  });

  it('shows the panel of a clicked stop and puts the marker on it', async () => {
    const el = await mount();
    q('[data-module="m02"]')?.click();
    expect(el.selected).toBe('m02');
    expect(q('[data-module="m02"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(q('[data-module="m00"]')?.getAttribute('aria-pressed')).toBe('false');
    expect(q('[data-panel="m02"]')?.hidden).toBe(false);
    expect(q('[data-panel="m00"]')?.hidden).toBe(true);
    expect(q('[data-part="marker"]')?.hidden).toBe(false);
  });

  it('ignores an unknown module', async () => {
    const el = await mount();
    el.select('m99');
    expect(el.selected).toBe('m00');
  });
});
