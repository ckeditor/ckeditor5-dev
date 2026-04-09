#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import { styleText } from 'node:util';
import { loadEnvFile } from 'node:process';
import * as tests from '../lib/index.js';

const options = tests.parseArguments( process.argv.slice( 2 ), {
	allowDefaultIdentityFile: true,
	commandName: 'ckeditor5-dev-tests-run-manual'
} );

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
