// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// "Pick a scenario, replay its capture": the shared part of figures such as
// PlaceDtb. Each scenario is a real run; the figure shows spans of its capture,
// the outcome as a bracketed word, and why. Rendered the same on the server and
// in the browser.

import type { CaptureRef, Outcome, OutcomeTag, ReplayScenario, Source, Verification } from '@ea/boards';
import { esc, renderConsole, VERIFICATION_LABEL } from './render.ts';

/** A scenario with its console spans read, ready to serialise for the client. */
export interface ReplayChoice {
  id: string;
  title: string;
  /** Extra text after the title, such as an address. */
  suffix: string;
  detail: string;
  /** The captured lines, with a note where lines are left out. */
  lines: string[];
  /** Where the lines come from, such as `logs/qemu/m10-overlap.log, lines 38–47`. */
  where: string;
  outcome: Outcome;
  explain: string;
  sources: Source[];
}

/** What every replay figure serialises for the client. */
export interface ReplayData {
  choices: ReplayChoice[];
}

/** Reads the spans of a capture. Pass `captureSpan` from `@ea/boards/node` at build time. */
export type SpanReader = (ref: CaptureRef) => string[];

/** The note shown between two spans that are not adjacent in the capture. */
export function gapNote(lines: number): string {
  return `(… ${lines} ${lines === 1 ? 'line' : 'lines'} not shown)`;
}

/** The lines of `spans`, in order, with a gap note between spans that skip lines. */
export function readSpans(spans: CaptureRef[], read: SpanReader): string[] {
  return spans.flatMap((ref, k) => {
    const prev = spans[k - 1];
    const gap = prev ? ref.from - prev.to - 1 : 0;
    return [...(gap > 0 ? [gapNote(gap)] : []), ...read(ref)];
  });
}

export function spanWhere(spans: CaptureRef[]): string {
  const ranges = spans.map((s) => (s.from === s.to ? `${s.from}` : `${s.from}–${s.to}`)).join(', ');
  const plural = spans.length > 1 || spans[0]?.from !== spans[0]?.to;
  return `logs/${spans[0]?.log ?? ''}, ${plural ? 'lines' : 'line'} ${ranges}`;
}

export function toReplayChoice(s: ReplayScenario, read: SpanReader, suffix = ''): ReplayChoice {
  return {
    id: s.id,
    title: s.title,
    suffix,
    detail: s.detail,
    lines: readSpans(s.console, read),
    where: spanWhere(s.console),
    outcome: s.outcome,
    explain: s.explain,
    sources: s.sources,
  };
}

/** The tag as a fixed-width status, like systemd: `[  OK  ]`, `[FAILED]`. */
export function outcomeLabel(tag: OutcomeTag): string {
  const pad = 6 - tag.length;
  const left = Math.floor(pad / 2);
  return `[${' '.repeat(left)}${tag}${' '.repeat(pad - left)}]`;
}

export function outcomeTone(tag: OutcomeTag): 'ok' | 'fail' | 'warn' {
  return tag === 'OK' ? 'ok' : tag === 'FAILED' ? 'fail' : 'warn';
}

/** Escapes text and turns `backticks` into code. */
export function renderInline(text: string): string {
  return esc(text).replace(/`([^`]+)`/g, '<code>$1</code>');
}

/** The new index for a key pressed in the choice list, or undefined if the key does nothing. */
export function choiceKey(key: string, index: number, count: number): number | undefined {
  if (count < 1) return undefined;
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
      return (index + 1) % count;
    case 'ArrowUp':
    case 'ArrowLeft':
      return (index - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
}

export function clampChoice(choices: readonly unknown[], index: number): number {
  return Math.max(0, Math.min(choices.length - 1, Math.trunc(index)));
}

/** The choices as a radio group's items; `(*)` marks the one picked. */
export function renderChoices(choices: ReplayChoice[], selected: number): string {
  return choices
    .map((c, k) => {
      const on = k === selected;
      return (
        `<button type="button" role="radio" class="ea-replay__choice" data-choice="${k}" aria-checked="${on}" tabindex="${on ? 0 : -1}">` +
        `<span class="ea-replay__title"><span class="ea-replay__mark" aria-hidden="true">${on ? '(*)' : '( )'}</span> ${esc(c.title)}` +
        (c.suffix ? `<span class="ea-replay__suffix"> · ${esc(c.suffix)}</span>` : '') +
        `</span><span class="ea-replay__detail">${esc(c.detail)}</span></button>`
      );
    })
    .join('');
}

export function renderReplayConsole(choice: ReplayChoice): string {
  return `${renderConsole(choice.lines)}<span class="ea-console__cursor" aria-hidden="true"></span>`;
}

/** The outcome, why it happens, and the sources. */
export function renderOutcome(choice: ReplayChoice): string {
  const tag = choice.outcome.tag;
  const sources = choice.sources
    .map((src) => {
      const title = esc(src.title) + (src.section ? `, ${esc(src.section)}` : '');
      return src.url ? `<a href="${esc(src.url)}" rel="noopener">${title}</a>` : title;
    })
    .join('; ');
  return (
    `<p class="ea-replay__outcome"><span class="ea-replay__tag is-${outcomeTone(tag)}">${outcomeLabel(tag)}</span> ${esc(choice.outcome.text)}</p>` +
    `<p class="ea-replay__explain">${renderInline(choice.explain)}</p>` +
    `<p class="ea-chain__sources t-small">Sources: ${sources}</p>`
  );
}

/** What a screen reader hears when the choice changes. */
export function replayStatus(choice: ReplayChoice): string {
  return `${choice.title}${choice.suffix ? ` ${choice.suffix}` : ''}: ${choice.outcome.tag}, ${choice.outcome.text}.`;
}

/**
 * The verification label shared by every capture in `logs`, read from their
 * `# verification:` headers; the weakest level wins.
 */
export function captureVerification(
  logs: string[],
  read: (log: string) => { header: Record<string, string[]> },
): string {
  const order: Verification[] = ['unverified', 'emulated', 'hardware'];
  const levels = [...new Set(logs)].map((log) => {
    const level = read(log).header.verification?.[0] as Verification | undefined;
    return level && order.includes(level) ? level : 'unverified';
  });
  const weakest = order.find((l) => levels.includes(l)) ?? 'unverified';
  return VERIFICATION_LABEL[weakest];
}
