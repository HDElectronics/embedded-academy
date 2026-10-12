// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

const LESSON = '/courses/linux-boot-arm/04-first-stage-and-dram/04-lab-measure-spl-against-sram/';

test('adding bytes to SPL shrinks the margin until the link fails', async ({ page }) => {
  await page.goto(LESSON);
  const fig = page.locator('[data-figure="spl-fit"]');
  await expect(fig).toHaveAttribute('data-ready', '');
  const result = fig.locator('[data-part="result"]');
  await expect(result).toContainText('[  OK  ] fits under limit B, 184 bytes to spare');

  await fig.getByRole('button', { name: '+64 bytes' }).click();
  await expect(result).toContainText('120 bytes to spare');

  await fig.getByRole('button', { name: '+1 KiB' }).click();
  await expect(result).toContainText('[FAILED] 904 bytes past limit B');
  await expect(fig.getByRole('button', { name: '+64 bytes' })).toHaveAttribute('aria-disabled', 'true');

  await page.keyboard.press('ArrowRight');
  await expect(fig.getByRole('button', { name: 'Undo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(result).toContainText('120 bytes to spare');
});
