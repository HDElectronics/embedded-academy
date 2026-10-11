// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

/** One directory in the header prompt. Segments without `href` have no page of their own. */
export interface PromptSegment {
  label: string;
  href?: string;
  /** True for the page being viewed. */
  current: boolean;
  /** True for segments a phone hides behind an ellipsis: all but `~` and the last two. */
  far: boolean;
}

/** A command after the `$` that links to where the learner most likely goes next. */
export interface PromptHint {
  command: string;
  href: string;
  /** Plain-language description for screen readers, read after the command. */
  label: string;
}

/**
 * Splits a site path into prompt segments, starting at `~` for the home page.
 * A segment links to its path only when `hasPage` says a page exists there.
 */
export function promptPath(pathname: string, hasPage: (href: string) => boolean): PromptSegment[] {
  const parts = pathname.split('/').filter(Boolean);
  const home = parts.length === 0;
  const segments: PromptSegment[] = [{ label: '~', href: home ? undefined : '/', current: home, far: false }];
  let href = '/';
  parts.forEach((part, k) => {
    href += `${part}/`;
    const current = k === parts.length - 1;
    segments.push({
      label: part,
      href: !current && hasPage(href) ? href : undefined,
      current,
      far: k < parts.length - 2,
    });
  });
  return segments;
}
