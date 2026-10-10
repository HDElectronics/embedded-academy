// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import type { Board, Source, StageLog, Verification, World } from '@ea/boards';
import { formatAddress } from '@ea/boards';

/** Everything a chain animation needs about one board, serialisable to JSON for the client. */
export interface ChainBoard {
  id: string;
  name: string;
  soc: string;
  cpu: string;
  summary: string;
  logIllustrative: boolean;
  regions: ChainRegion[];
  stages: ChainStage[];
}

export interface ChainRegion {
  id: string;
  label: string;
  /** Formatted base address and size, or a note; empty when the source states neither. */
  detail: string;
}

export interface ChainStage {
  id: string;
  name: string;
  file: string;
  from: string;
  region: string;
  core: string;
  level: string;
  world: World;
  does: string[];
  sources: Source[];
  verification: Verification;
  log: string[];
}

function formatSize(bytes: number): string {
  if (bytes % (1024 * 1024) === 0) return `${bytes / (1024 * 1024)} MB`;
  if (bytes % 1024 === 0) return `${bytes / 1024} KB`;
  return `${bytes} B`;
}

export function toChainBoard(board: Board, log: StageLog): ChainBoard {
  return {
    id: board.id,
    name: board.name,
    soc: board.soc,
    cpu: board.cpu,
    summary: board.summary,
    logIllustrative: log.header.captured !== 'yes',
    regions: board.regions.map((r) => ({
      id: r.id,
      label: r.label,
      detail: [
        r.base === undefined ? '' : formatAddress(r.base),
        r.size === undefined ? '' : formatSize(r.size),
        r.note ?? '',
      ]
        .filter(Boolean)
        .join(' · '),
    })),
    stages: board.stages.map((s) => ({
      id: s.id,
      name: s.name,
      file: s.file,
      from: s.from,
      region: s.region,
      core: s.core,
      level: s.level,
      world: s.world,
      does: s.does,
      sources: s.sources,
      verification: s.verification,
      log: log.stages.get(s.id) ?? [],
    })),
  };
}
