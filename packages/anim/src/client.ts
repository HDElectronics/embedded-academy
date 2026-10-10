// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

// Browser entry: registers the custom elements.

import { defineBootChain } from './boot-chain.ts';
import { defineSerialConsole } from './serial-console.ts';

defineBootChain();
defineSerialConsole();
