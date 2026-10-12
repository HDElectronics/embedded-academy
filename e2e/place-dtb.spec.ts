// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

const LESSON = '/courses/linux-boot-arm/10-capstones-and-debugging/03-when-the-boot-stops/';

test('PlaceDtb replays U-Boot’s answer for the chosen Device Tree address', async ({ page }) => {
  await page.goto(LESSON);
  const figure = page.locator('[data-figure="place-dtb"]').first();
  await expect(figure).toHaveAttribute('data-ready', '');
  await expect(figure.locator('[data-part="outcome"]')).toContainText('no valid Device Tree');

  await figure.getByRole('radio', { name: /Above the kernel/ }).click();
  await expect(figure.getByRole('radio', { name: /Above the kernel/ })).toHaveAttribute('aria-checked', 'true');
  await expect(figure.locator('[data-part="outcome"]')).toContainText('the kernel starts');
  await expect(figure.locator('[data-part="console"]')).toContainText('Starting kernel ...');

  await page.keyboard.press('ArrowDown');
  await expect(figure.getByRole('radio', { name: /An address with no tree/ })).toBeFocused();
  await expect(figure.locator('[data-part="outcome"]')).toContainText('no valid Device Tree');
});
