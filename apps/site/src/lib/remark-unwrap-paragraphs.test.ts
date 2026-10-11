// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';
import remarkUnwrapParagraphs from './remark-unwrap-paragraphs.mjs';

const text = (value: string) => ({ type: 'text', value });
const paragraph = (...children: object[]) => ({ type: 'paragraph', children });
const jsx = (name: string, ...children: object[]) => ({ type: 'mdxJsxFlowElement', name, children });

function run(tree: object) {
  remarkUnwrapParagraphs()(tree);
  return tree;
}

describe('remarkUnwrapParagraphs', () => {
  it('lifts the paragraph MDX makes inside a <p> into the <p> itself', () => {
    const tree = run({ type: 'root', children: [jsx('p', paragraph(text('Lead text.')))] });
    expect(tree).toEqual({ type: 'root', children: [jsx('p', text('Lead text.'))] });
  });

  it('leaves paragraphs inside block elements alone', () => {
    const aside = jsx('aside', paragraph(text('One.')), paragraph(text('Two.')));
    expect(run({ type: 'root', children: [aside] })).toEqual({ type: 'root', children: [aside] });
  });

  it('reaches elements nested inside components', () => {
    const tree = run({ type: 'root', children: [jsx('Deeper', jsx('p', paragraph(text('Inside.'))))] });
    expect(tree).toEqual({ type: 'root', children: [jsx('Deeper', jsx('p', text('Inside.')))] });
  });
});
