// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { vi } from 'vitest';
import { ladderState, renderLadder } from './ladder.ts';
import { definePrivilegeLadder, type EaPrivilegeLadder } from './privilege-ladder.ts';
import type { ChainBoard } from './types.ts';

/** Mounts an <ea-privilege-ladder> for `board` in the test document. */
export async function defineLadderForTest(board: ChainBoard, reducedMotion = false): Promise<EaPrivilegeLadder> {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({ matches: reducedMotion && query.includes('reduce'), media: query }) as MediaQueryList,
  );
  definePrivilegeLadder();
  document.body.innerHTML = `
    <ea-privilege-ladder>
      <script type="application/json" data-ladder>${JSON.stringify(board)}</script>
      <button data-part="prev">Previous</button><button data-part="play">Play boot</button><button data-part="next">Next</button>
      <p data-part="status"></p>
      <div data-part="ladder">${renderLadder(board, ladderState(board, 0))}</div>
    </ea-privilege-ladder>`;
  await Promise.resolve();
  const el = document.querySelector('ea-privilege-ladder');
  if (!el) throw new Error('not mounted');
  return el as EaPrivilegeLadder;
}
