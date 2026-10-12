// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import { bbb } from './data/bbb.ts';
import { rpi4 } from './data/rpi4.ts';
import { stm32mp157 } from './data/stm32mp157.ts';
import type { Board } from './schema.ts';

export * from './log.ts';
export * from './schema.ts';
export * from './sources.ts';

/** Boards in teaching order. */
export const boards: readonly Board[] = [rpi4, bbb, stm32mp157];

export function getBoard(id: Board['id']): Board {
  const board = boards.find((b) => b.id === id);
  if (!board) throw new Error(`Unknown board: ${id}`);
  return board;
}

export function formatAddress(value: number): string {
  const hex = value.toString(16).toUpperCase().padStart(8, '0');
  return `0x${hex.slice(0, 4)}_${hex.slice(4)}`;
}

// Figure: ExceptionLevels (m01)
export * from './interactives/exception-levels.ts';

// Figure: SplFit (m04)
export * from './interactives/spl-fit.ts';
