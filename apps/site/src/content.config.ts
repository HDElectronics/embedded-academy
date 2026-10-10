// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const BOARD = z.enum(['rpi4', 'bbb', 'stm32mp157']);
const MODULE = z.string().regex(/^m(0\d|10)$/, 'module must be m00 to m10');

const source = z.object({
  title: z.string().min(1),
  url: z.url().optional(),
  section: z.string().min(1).optional(),
});

const courses = defineCollection({
  loader: glob({
    pattern: '*/course.yaml',
    base: '../../content/courses',
    generateId: ({ entry }) => entry.split('/')[0] ?? entry,
  }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(160),
    boards: z.array(BOARD).min(1),
    modules: z.array(z.object({ id: MODULE, title: z.string().min(1), summary: z.string().min(1) })).min(1),
  }),
});

const lessons = defineCollection({
  loader: glob({ pattern: '*/[0-9][0-9]-*/*.mdx', base: '../../content/courses' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(160),
    course: z.string().regex(/^[a-z0-9-]+$/),
    module: MODULE,
    order: z.number().int().positive(),
    type: z.enum(['tutorial', 'how-to', 'reference', 'explanation']),
    boards: z.array(BOARD),
    verification: z.enum(['unverified', 'emulated', 'hardware']),
    sources: z.array(source).min(1),
    draft: z.boolean().default(false),
  }),
});

export const collections = { courses, lessons };
