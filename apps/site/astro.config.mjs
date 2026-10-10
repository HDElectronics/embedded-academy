// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [mdx()],
  markdown: {
    shikiConfig: { theme: 'css-variables' },
  },
});
