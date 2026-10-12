// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

const LESSON = '/courses/linux-boot-arm/10-capstones-and-debugging/02-read-each-boards-boot-trace/';

test('the quiz asks for the line after BL1 boots BL2', async ({ page }) => {
  await page.goto(LESSON);
  const quiz = page.locator('[data-figure="predict-line"]');
  await expect(quiz.locator('[data-part="console"]')).toContainText('NOTICE:  BL1: Booting BL2');
  await expect(quiz.locator('[data-choice]')).toHaveCount(3);
  await expect(quiz.locator('[data-part="meta"]')).toHaveText('question 1/5 · score 0/5');
});

test('arrow keys and Enter pick the right line and score it', async ({ page }) => {
  await page.goto(LESSON);
  const quiz = page.locator('ea-predict-line');
  await expect(quiz).toHaveAttribute('data-ready', '');
  await quiz.locator('[data-choice="0"]').focus();
  await page.keyboard.press('ArrowDown');
  await expect(quiz.locator('[data-choice="1"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(quiz.locator('[data-part="result"]')).toContainText('Right.');
  await expect(quiz.locator('[data-part="meta"]')).toHaveText('question 1/5 · score 1/5');
  await quiz.getByRole('button', { name: 'Next question' }).click();
  await expect(quiz.locator('[data-part="meta"]')).toHaveText('question 2/5 · score 1/5');
});
