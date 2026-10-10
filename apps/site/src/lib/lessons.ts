// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { type CollectionEntry, getCollection } from 'astro:content';

export type Lesson = CollectionEntry<'lessons'>;

/** Published lessons of a course, in module then lesson order. Drafts show only in dev. */
export async function courseLessons(course: string): Promise<Lesson[]> {
  const all = await getCollection(
    'lessons',
    ({ data }) => data.course === course && (import.meta.env.DEV || !data.draft),
  );
  return all.sort((a, b) => a.data.module.localeCompare(b.data.module) || a.data.order - b.data.order);
}

/** URL path of a lesson: /courses/<course>/<module folder>/<file>/ */
export function lessonHref(lesson: Lesson): string {
  return `/courses/${lesson.id}/`;
}
