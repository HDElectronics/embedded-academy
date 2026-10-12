// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';
import rehypeScrollTables from './rehype-scroll-tables.mjs';

const el = (tagName: string, ...children: object[]) => ({ type: 'element', tagName, properties: {}, children });

function run(tree: object) {
  rehypeScrollTables()(tree);
  return tree;
}

describe('rehypeScrollTables', () => {
  it('wraps a table in a focusable, labelled scroll region', () => {
    const table = el('table', el('tr'));
    const tree = run({ type: 'root', children: [table] }) as {
      children: { tagName: string; properties: object; children: object[] }[];
    };
    const [region] = tree.children;
    expect(region?.tagName).toBe('div');
    expect(region?.properties).toEqual({
      className: ['table-scroll'],
      tabIndex: 0,
      role: 'region',
      ariaLabel: 'Table, scrolls sideways',
    });
    expect(region?.children).toEqual([table]);
  });

  it('finds tables nested inside other elements and leaves the rest alone', () => {
    const p = el('p');
    const tree = run({ type: 'root', children: [el('section', p, el('table'))] }) as {
      children: { children: { tagName: string }[] }[];
    };
    expect(tree.children[0]?.children.map((c) => c.tagName)).toEqual(['p', 'div']);
  });
});
