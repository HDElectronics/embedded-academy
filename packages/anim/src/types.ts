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
  /** Images this stage copies into memory. */
  loads: ChainLoad[];
  sources: Source[];
  verification: Verification;
  log: string[];
}

export interface ChainLoad {
  file: string;
  from: string;
  to: string;
  /** Formatted load address, or empty when the source states none. */
  address: string;
  top: boolean;
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
      loads: (s.loads ?? []).map((l) => ({
        file: l.file,
        from: l.from,
        to: l.to,
        address: l.address === undefined ? '' : formatAddress(l.address),
        top: l.place === 'top',
      })),
      sources: s.sources,
      verification: s.verification,
      log: log.stages.get(s.id) ?? [],
    })),
  };
}

/** Where a module sits on the boot path drawn by CourseMap. */
export type MapWorld = 'firmware' | 'secure' | 'normal' | 'mixed';

/** One module as CourseMap draws it. Modules without `chain` sit before or after the line. */
export interface MapModule {
  id: string;
  title: string;
  summary: string;
  chain?: { short: string; world: MapWorld } | undefined;
  lessons: { title: string; href: string; type: string }[];
}
