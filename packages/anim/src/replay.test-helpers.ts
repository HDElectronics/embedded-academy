// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { vi } from 'vitest';
import { type ReplayData, renderChoices, renderOutcome, renderReplayConsole } from './replay.ts';
import { defineReplayFigure, type ReplayFigure, type SceneRenderer } from './replay-figure.ts';

/** Mounts a replay figure `tag` for `data` in the test document, as the server renders it. */
export async function mountReplayForTest<T extends ReplayData>(
  tag: string,
  data: T,
  scene: SceneRenderer<T>,
  { reducedMotion = false, start = 0 } = {},
): Promise<ReplayFigure<T>> {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({ matches: reducedMotion && query.includes('reduce'), media: query }) as MediaQueryList,
  );
  defineReplayFigure(tag, scene);
  const choice = data.choices[start];
  if (!choice) throw new Error('no such choice');
  document.body.innerHTML = `
    <${tag}>
      <script type="application/json" data-replay>${JSON.stringify(data)}</script>
      <div data-part="scene">${scene(data, start)}</div>
      <div role="radiogroup" data-part="choices">${renderChoices(data.choices, start)}</div>
      <button data-part="play">Replay console</button>
      <div data-part="console">${renderReplayConsole(choice)}</div>
      <p data-part="where">${choice.where}</p>
      <div data-part="outcome">${renderOutcome(choice)}</div>
      <p data-part="status"></p>
    </${tag}>`;
  await Promise.resolve();
  const el = document.querySelector(tag);
  if (!el) throw new Error('not mounted');
  return el as ReplayFigure<T>;
}

export function part(name: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (!el) throw new Error(`no part ${name}`);
  return el;
}

export function radio(index: number): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-choice="${index}"]`);
  if (!el) throw new Error(`no choice ${index}`);
  return el;
}
