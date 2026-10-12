// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

const LESSON = '/courses/linux-boot-arm/09-linux-takes-over/03-root-and-pid-1/';

test('BreakBoot replays the boot for the chosen kernel argument', async ({ page }) => {
  await page.goto(LESSON);
  const figure = page.locator('[data-figure="break-boot"]');
  await expect(figure).toHaveAttribute('data-ready', '');
  await expect(figure.locator('[data-part="outcome"]')).toContainText('kernel panic');

  await figure.getByRole('radio', { name: /Wait for that disk/ }).click();
  await expect(figure.getByRole('radio', { name: /Wait for that disk/ })).toHaveAttribute('aria-checked', 'true');
  await expect(figure.locator('[data-part="outcome"]')).toContainText('[ WAIT ]');
  await expect(figure.locator('[data-part="console"]')).toContainText('Waiting for root device /dev/vdb...');
  await expect(figure.locator('[data-part="scene"]')).toContainText('rootwait');

  await page.keyboard.press('Home');
  await expect(figure.getByRole('radio', { name: /Nothing changed/ })).toBeFocused();
  await expect(figure.locator('[data-part="outcome"]')).toContainText('login prompt');
});
