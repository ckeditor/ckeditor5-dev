#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { styleText } from 'node:util';
import { fileURLToPath } from 'node:url';
import * as tests from '../lib/index.js';

const options = tests.parseArguments( process.argv.slice( 2 ), { allowDefaultIdentityFile: true } );

// By default, the watch mechanism should be enabled in manual tests.
// However, it makes sense to disable it when a developer wants to compile these files once,
// without rebuilding it. See: https://github.com/ckeditor/ckeditor5/issues/10982.
options.disableWatch = process.argv.includes( '--disable-watch' );

// "Lark" is the default theme for tests.
options.themePath = fileURLToPath( import.meta.resolve( '@ckeditor/ckeditor5-theme-lark' ) );

tests.runManualTests( options )
	.catch( error => {
		// Mark result of this task as invalid.
		process.exitCode = 1;

		console.log( styleText( 'red', error.stack ) );
	} );
