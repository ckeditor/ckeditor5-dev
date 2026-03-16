#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import { styleText } from 'node:util';
import { loadEnvFile } from 'node:process';
import * as tests from '../lib/index.js';

const options = tests.parseArguments( process.argv.slice( 2 ), { allowDefaultIdentityFile: true } );

// By default, the watch mechanism should be enabled in manual tests.
// However, it makes sense to disable it when a developer wants to compile these files once,
// without rebuilding it. See: https://github.com/ckeditor/ckeditor5/issues/10982.
options.disableWatch = process.argv.includes( '--disable-watch' );

if ( fs.existsSync( '.env' ) ) {
	loadEnvFile( '.env' );
}

tests.runManualTests( options )
	.catch( error => {
		const message = error instanceof Error ? error.stack : error.toString();
		console.log( styleText( 'red', message ) );

		// Mark result of this task as invalid.
		process.exit( 1 );
	} );
