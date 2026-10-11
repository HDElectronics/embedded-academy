// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const LESSON = '/courses/linux-boot-arm/00-orientation/01-the-boot-chain-at-a-glance/';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

test('home page shows a complete boot chain before any interaction', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Embedded Academy' })).toBeVisible();
  const chain = page.locator('ea-boot-chain');
  await expect(chain).toHaveAttribute('data-ready', '');
  await expect(chain.locator('[aria-current="step"]')).toHaveCount(1);
  await expect(chain.locator('.ea-chain__name')).toHaveText('Boot ROM');
  expect(errors).toEqual([]);
});

test('Next and Previous move through the stages', async ({ page }) => {
  await page.goto('/');
  const chain = page.locator('ea-boot-chain');
  await chain.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(chain.locator('.ea-chain__count')).toHaveText(/^Stage 2 of \d+$/);
  await expect(chain.locator('.ea-stage__state--ok')).toHaveCount(1);
  await chain.getByRole('button', { name: 'Previous' }).click();
  await expect(chain.locator('.ea-chain__count')).toHaveText(/^Stage 1 of \d+$/);
});

test('Play runs the chain and types console output', async ({ page }) => {
  await page.goto('/');
  const chain = page.locator('ea-boot-chain');
  await chain.getByRole('button', { name: 'Play boot' }).click();
  await expect(chain.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(chain.locator('.ea-chain__count')).toHaveText(/^Stage 3 of \d+$/, { timeout: 15_000 });
  await expect(chain.locator('[data-part="console"] .ea-console__line')).not.toHaveCount(0);
});

test('arrow keys switch boards on the tabs', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Board' });
  await tabs.getByRole('tab', { selected: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab', { selected: true })).toHaveText('1:bbb');
  await expect(tabs.getByRole('tab', { selected: true })).toBeFocused();
  await expect(page.locator('[data-part="meta"]')).toContainText('AM3358');
});

test('the header prompt shows where you are and links to the next step', async ({ page }) => {
  await page.goto('/');
  const prompt = page.getByRole('navigation', { name: 'You are here' });
  await prompt.getByRole('link', { name: /^cd courses\/linux-boot-arm\// }).click();
  await expect(page).toHaveURL(/\/courses\/linux-boot-arm\/$/);
  await expect(prompt.locator('[aria-current="page"]')).toHaveText('linux-boot-arm');
  await prompt.getByRole('link', { name: /^less / }).click();
  await expect(page).toHaveURL(LESSON);
  await prompt.getByRole('link', { name: /linux-boot-arm/ }).click();
  await expect(page).toHaveURL(/\/courses\/linux-boot-arm\/$/);
});

test('theme toggle switches to paper and remembers it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Theme: tty/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('the course map shows the module you pick', async ({ page }) => {
  await page.goto('/courses/linux-boot-arm/');
  const map = page.locator('ea-course-map');
  await expect(map).toHaveAttribute('data-ready', '');
  await expect(map.getByRole('heading', { level: 2, name: 'Orientation' })).toBeVisible();
  await map.getByRole('button', { name: /U-Boot/ }).click();
  await expect(map.getByRole('button', { name: /U-Boot/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(map.getByRole('heading', { level: 2, name: 'U-Boot' })).toBeVisible();
  await expect(map.getByRole('heading', { level: 2, name: 'Orientation' })).toBeHidden();
});

test('the serial console jumps to the stage you pick', async ({ page }) => {
  await page.goto(LESSON);
  const serial = page.locator('ea-serial-console');
  await expect(serial).toHaveAttribute('data-ready', '');
  const strip = serial.getByRole('list', { name: 'Jump to a stage' });
  await strip.getByRole('button', { name: /U-Boot/ }).click();
  await expect(strip.locator('[aria-current="step"]')).toContainText('U-Boot');
  await expect(serial.locator('.ea-serial__line').last()).toContainText('U-Boot');
});

test('a lesson becomes a tmux-style split on wide screens only', async ({ page }, info) => {
  await page.goto(LESSON);
  const session = page.locator('ea-session');
  await expect(session).toHaveAttribute('data-ready', '');
  const tabs = page.getByRole('tablist', { name: 'Windows' });
  if (info.project.name === 'phone') {
    await expect(session).toHaveAttribute('data-layout', 'inline');
    await expect(tabs).toBeHidden();
    return;
  }
  await expect(session).toHaveAttribute('data-layout', 'split');
  await page.getByRole('button', { name: /^Window 2: privilege/ }).click();
  await expect(tabs.getByRole('tab', { selected: true })).toHaveText('2:privilege');
  await expect(page.locator('ea-privilege-ladder')).toBeVisible();
  await page.getByRole('button', { name: '0:read' }).click();
  await expect(session).toHaveAttribute('data-zoom', 'read');
  await expect(page.locator('ea-privilege-ladder')).toBeHidden();
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('Play becomes Next and output appears at once', async ({ page }) => {
    await page.goto('/');
    const chain = page.locator('ea-boot-chain');
    const play = chain.getByRole('button', { name: 'Next stage' });
    await expect(play).toBeVisible();
    await play.click();
    await expect(chain.locator('.ea-chain__count')).toHaveText(/^Stage 2 of \d+$/);
    await expect(chain.locator('[data-part="console"] .ea-console__cursor')).toHaveCount(1);
  });
});

for (const theme of ['dark', 'light'] as const) {
  for (const path of ['/', '/courses/linux-boot-arm/', LESSON]) {
    test(`no accessibility violations on ${path} (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('ea-theme', t), theme);
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
    });
  }
}
