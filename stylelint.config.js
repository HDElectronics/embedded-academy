// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// Colours come only from design tokens. Raw colour values are allowed in the
// generated token file and in the docs theme, which maps the same tokens onto Furo.
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-html/astro'],
  // tokens.css is generated from tokens.json; lint the source, not the output.
  ignoreFiles: [
    '.claude/worktrees/**',
    '**/dist/**',
    '**/.astro/**',
    'docs/_build/**',
    'coverage/**',
    'packages/ui/src/tokens.css',
  ],
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch'],
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    'declaration-block-single-line-max-declarations': null,
    'import-notation': 'string',
    'no-descending-specificity': null,
  },
  overrides: [
    {
      files: ['docs/_static/**/*.css'],
      rules: { 'color-no-hex': null, 'function-disallowed-list': null },
    },
  ],
};
