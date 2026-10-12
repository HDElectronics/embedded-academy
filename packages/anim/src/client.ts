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

// Interactive figures
import { definePredictLine } from './predict-line.ts';

definePredictLine();

import { defineHandoffRelay } from './handoff-relay.ts';

defineHandoffRelay();

// Figure: ExceptionLevels
import { defineExceptionLevels } from './exception-levels.ts';

defineExceptionLevels();

// Figure: SplFit
import { defineSplFit } from './spl-fit.ts';

defineSplFit();
