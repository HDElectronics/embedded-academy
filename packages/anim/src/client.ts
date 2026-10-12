// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// Browser entry: registers the custom elements.

import { defineBootChain } from './boot-chain.ts';
import { defineCourseMap } from './course-map.ts';
import { definePrivilegeLadder } from './privilege-ladder.ts';
import { defineSerialConsole } from './serial-console.ts';

defineBootChain();
defineCourseMap();
definePrivilegeLadder();
defineSerialConsole();

// Replay figures: pick a scenario, replay its capture.
import { renderBreakScene } from './break-boot.ts';
import { renderPlaceScene } from './place-dtb.ts';
import { defineReplayFigure } from './replay-figure.ts';

defineReplayFigure('ea-place-dtb', renderPlaceScene);
defineReplayFigure('ea-break-boot', renderBreakScene);
