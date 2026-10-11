// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

/**
 * MDX parses text written on its own lines inside a JSX element as a
 * paragraph, so `<p class="t-lead">` followed by text renders a <p> inside a
 * <p>, which is invalid HTML: browsers close the outer one early and the text
 * loses its class. This plugin lifts that paragraph's content into elements
 * that may only hold phrasing content.
 */

const PHRASING_ONLY = new Set(['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figcaption', 'summary']);

/** @param {any} node */
function unwrap(node) {
  if (!Array.isArray(node.children)) return;
  for (const child of node.children) unwrap(child);
  if (node.type !== 'mdxJsxFlowElement' || !PHRASING_ONLY.has(node.name)) return;
  node.children = node.children.flatMap((/** @type {any} */ child) =>
    child.type === 'paragraph' ? child.children : [child],
  );
}

export default function remarkUnwrapParagraphs() {
  return (/** @type {any} */ tree) => unwrap(tree);
}
