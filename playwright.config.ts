// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { defineConfig, devices } from '@playwright/test';

// Tests run against the built site (apps/site/dist), served by `astro preview`.
// Run `pnpm build` first; CI downloads the build artifact instead.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4322', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm --filter @ea/site preview --port 4322',
    url: 'http://localhost:4322',
    reuseExistingServer: !process.env.CI,
  },
});
