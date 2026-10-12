// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

const LESSON = '/courses/linux-boot-arm/10-capstones-and-debugging/01-lab-the-whole-chain-on-qemu/';

test('the hand-off relay shows BL1 before any interaction', async ({ page }) => {
  await page.goto(LESSON);
  const relay = page.locator('[data-figure="handoff-relay"]');
  await expect(relay.locator('[aria-pressed="true"]')).toContainText('BL1');
  await expect(relay.locator('.ea-relay__summary')).toContainText('Entry point 0x0E05_B000');
});

test('Next stage walks to the kernel hand-off and says it is a separate run', async ({ page }) => {
  await page.goto(LESSON);
  const relay = page.locator('ea-handoff-relay');
  await expect(relay).toHaveAttribute('data-ready', '');
  for (let k = 0; k < 3; k += 1) await relay.getByRole('button', { name: 'Next stage' }).click();
  await expect(relay.locator('[aria-pressed="true"]')).toContainText('U-Boot');
  await expect(relay.locator('[data-part="status"]')).toHaveText(/^Stage 4 of 6: U-Boot/);
  await expect(relay.locator('[data-part="handoff"]')).toContainText('separate run');
  await expect(relay.locator('[data-part="console"]')).toContainText('Starting kernel ...');
});

test('arrow keys move between stages', async ({ page }) => {
  await page.goto(LESSON);
  const relay = page.locator('ea-handoff-relay');
  await expect(relay).toHaveAttribute('data-ready', '');
  await relay.locator('[data-step="0"]').focus();
  await page.keyboard.press('End');
  await expect(relay.locator('[data-step="5"]')).toBeFocused();
  await expect(relay.locator('[data-part="console"]')).toContainText('Welcome to Buildroot');
});
