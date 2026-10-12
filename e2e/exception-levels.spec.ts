// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

const LESSON = '/courses/linux-boot-arm/01-arm-for-booting/02-moving-between-levels/';

test('the elevator rides up with svc and smc and comes back with eret', async ({ page }) => {
  await page.goto(LESSON);
  const fig = page.locator('[data-figure="exception-levels"]');
  await expect(fig).toHaveAttribute('data-ready', '');
  const result = fig.locator('[data-part="result"]');

  // An instruction that cannot run stays focusable (aria-disabled) and explains itself.
  await fig.getByRole('button', { name: 'hvc #0' }).focus();
  await page.keyboard.press('Enter');
  await expect(result).toContainText('hvc is undefined at EL0');
  await expect(fig.locator('[data-token]')).toContainText('EL0');

  await fig.getByRole('button', { name: 'svc #0' }).click();
  await fig.getByRole('button', { name: 'smc #0' }).click();
  await expect(result).toContainText('smc #0: EL1 → EL3');
  await expect(fig.locator('.ea-ladder__cell.is-secure [data-token]')).toContainText('EL3');
  await expect(fig.locator('[data-frame]')).toHaveCount(2);

  await page.keyboard.press('End');
  await expect(fig.getByRole('button', { name: 'eret' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(result).toContainText('eret: EL3 → EL1');
  await expect(fig.locator('[data-frame]')).toHaveCount(1);
});
