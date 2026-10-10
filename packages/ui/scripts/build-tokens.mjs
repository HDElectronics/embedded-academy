// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// Compiles tokens.json into src/tokens.css.
// `--check` fails when src/tokens.css is out of date instead of writing it.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'tokens.json'), 'utf8'));
const outFile = join(root, 'src', 'tokens.css');

const alias = /^\{([A-Za-z0-9_.-]+)\}$/;
const colorValue = (value) => {
  const m = alias.exec(value);
  return m ? `var(--${m[1]})` : value;
};

const [first, ...others] = tokens.color.themes;
const valueFor = (token, theme) =>
  typeof token.value === 'string' ? token.value : (token.value[theme] ?? token.value[first.id]);

// REUSE-IgnoreStart
const lines = [
  '/*',
  ' * SPDX-FileCopyrightText: Embedded Academy contributors',
  ' * SPDX-License-Identifier: MIT',
  // REUSE-IgnoreEnd
  ' *',
  ' * Generated from tokens.json by scripts/build-tokens.mjs. Do not edit by hand.',
  ' */',
  '',
  `:root,\n[data-theme="${first.id}"] {`,
  `  color-scheme: ${first.id === 'light' ? 'light' : 'dark'};`,
];
for (const t of tokens.color.tokens) lines.push(`  --${t.name}: ${colorValue(valueFor(t, first.id))};`);
lines.push('}', '');

for (const theme of others) {
  lines.push(`[data-theme="${theme.id}"] {`, `  color-scheme: ${theme.id === 'light' ? 'light' : 'dark'};`);
  for (const t of tokens.color.tokens) {
    if (typeof t.value === 'string' || !(theme.id in t.value)) continue;
    lines.push(`  --${t.name}: ${colorValue(t.value[theme.id])};`);
  }
  lines.push('}', '');
}

lines.push(':root {');
for (const [key, stack] of Object.entries(tokens.type.families)) lines.push(`  --font-${key}: ${stack};`);
for (const family of ['spacing', 'radius']) {
  for (const t of tokens[family].tokens) lines.push(`  --${t.name}: ${t.value};`);
}
lines.push('}', '');

for (const group of tokens.type.groups) {
  for (const s of group.styles) {
    const family = s.family ?? group.family;
    lines.push(`.t-${s.name} {`);
    lines.push(`  font-family: var(--font-${family});`);
    lines.push(`  font-size: ${s.fontSize};`);
    lines.push(`  line-height: ${s.lineHeight};`);
    lines.push(`  font-weight: ${s.fontWeight};`);
    if (s.letterSpacing) lines.push(`  letter-spacing: ${s.letterSpacing};`);
    if (s.name === 'label') lines.push('  text-transform: uppercase;');
    lines.push('}', '');
  }
}

const css = `${lines.join('\n').trimEnd()}\n`;

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(outFile, 'utf8');
  } catch {}
  if (current !== css) {
    console.error('src/tokens.css is out of date. Run: pnpm --filter @ea/ui build:tokens');
    process.exit(1);
  }
  console.log('src/tokens.css is up to date');
} else {
  writeFileSync(outFile, css);
  console.log(`wrote ${outFile}`);
}
