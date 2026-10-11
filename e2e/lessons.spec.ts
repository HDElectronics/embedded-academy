// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Every built page under /courses/, so new lessons are checked without editing this file.
const DIST = join(process.cwd(), 'apps', 'site', 'dist');

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name === 'index.html' ? [`/${relative(DIST, dir).split(sep).join('/')}/`] : [];
  });
}

const paths = pages(join(DIST, 'courses'));

test('the build has course pages to check', () => {
  expect(paths.length).toBeGreaterThan(1);
});

for (const path of paths) {
  test(`${path} loads without errors and passes axe in both themes`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    for (const theme of ['dark', 'light'] as const) {
      await page.addInitScript((t) => localStorage.setItem('ea-theme', t), theme);
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${theme} ${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}
