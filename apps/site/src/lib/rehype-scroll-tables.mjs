// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

/**
 * Wraps every table in a scroll region, so a wide table scrolls inside its
 * own box on a phone instead of widening the page. The region is focusable
 * and labelled, so keyboard users can scroll it too (axe:
 * scrollable-region-focusable).
 */

/** @param {any} node */
function wrap(node) {
  if (!Array.isArray(node.children)) return;
  node.children = node.children.map((/** @type {any} */ child) => {
    if (child.type === 'element' && child.tagName === 'table') {
      return {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: 'Table, scrolls sideways' },
        children: [child],
      };
    }
    wrap(child);
    return child;
  });
}

export default function rehypeScrollTables() {
  return (/** @type {any} */ tree) => wrap(tree);
}
