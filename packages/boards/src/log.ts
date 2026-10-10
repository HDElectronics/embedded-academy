// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

/**
 * A serial log split into boot stages.
 *
 * File format:
 *   # key: value        header lines, only at the top
 *   @stage <id>         starts the chunk for stage <id>
 *   anything else       a console line of the current stage, kept verbatim
 */
export interface StageLog {
  header: Record<string, string>;
  stages: Map<string, string[]>;
}

const HEADER = /^#\s*([A-Za-z][\w-]*)\s*:\s*(.*)$/;
const STAGE = /^@stage\s+([a-z0-9-]+)\s*$/;

export function parseStageLog(text: string): StageLog {
  const header: Record<string, string> = {};
  const stages = new Map<string, string[]>();
  let current: string[] | undefined;
  let inHeader = true;

  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (inHeader) {
      if (raw.trim() === '' || raw.trim() === '#') continue;
      const h = HEADER.exec(raw);
      if (h?.[1] && h[2] !== undefined) {
        header[h[1].toLowerCase()] = h[2].trim();
        continue;
      }
      inHeader = false;
    }
    const s = STAGE.exec(raw);
    if (s?.[1]) {
      if (stages.has(s[1])) throw new Error(`Duplicate @stage ${s[1]}`);
      current = [];
      stages.set(s[1], current);
      continue;
    }
    if (!current) {
      if (raw.trim() === '') continue;
      throw new Error(`Line before the first @stage: ${raw}`);
    }
    current.push(raw);
  }

  for (const lines of stages.values()) {
    while (lines.length > 0 && lines.at(-1)?.trim() === '') lines.pop();
  }
  return { header, stages };
}

/** Header keys every log must carry (see the accuracy policy). */
export const REQUIRED_LOG_HEADERS = ['board', 'software', 'captured', 'verification'] as const;
