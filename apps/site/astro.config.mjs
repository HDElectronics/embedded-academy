// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import remarkUnwrapParagraphs from './src/lib/remark-unwrap-paragraphs.mjs';

export default defineConfig({
  integrations: [mdx()],
  markdown: {
    // Astro 7 renders Markdown with Sätteri, which runs no remark plugins.
    // The unified processor does, and MDX inherits it.
    processor: unified({ remarkPlugins: [remarkUnwrapParagraphs] }),
    shikiConfig: { theme: 'css-variables' },
  },
});
