// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// ESLint covers only .astro and .mdx files. Biome lints everything else.
import astro from 'eslint-plugin-astro';
import * as mdx from 'eslint-plugin-mdx';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['**/dist/**', '**/.astro/**', '**/node_modules/**', 'docs/**', 'coverage/**', '**/*.{js,mjs,ts}'] },
  ...astro.configs.recommended,
  {
    files: ['**/*.astro'],
    languageOptions: { parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.astro'] } },
  },
  {
    ...mdx.flat,
    files: ['**/*.mdx'],
  },
];
