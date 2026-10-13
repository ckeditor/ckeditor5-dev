#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { runCli } from '../dist/cli.js';

process.exitCode = await runCli( process.argv.slice( 2 ) );
