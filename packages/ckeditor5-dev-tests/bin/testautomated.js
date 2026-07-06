#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import { styleText } from 'node:util';
import { loadEnvFile } from 'node:process';
import runAutomatedTests from '../lib/tasks/runautomatedtests.js';
import parseArguments from '../lib/utils/parsearguments.js';

const options = parseArguments( process.argv.slice( 2 ), {
	commandName: 'ckeditor5-dev-tests-run-automated'
} );

if ( options.files.length === 0 ) {
	options.files = [ '*' ];
}

if ( fs.existsSync( '.env' ) ) {
	loadEnvFile( '.env' );
}

runAutomatedTests( options )
	.then( () => {
		process.exit( 0 );
	} )
	.catch( error => {
		const message = error instanceof Error ? error.stack : error.toString();
		console.log( styleText( 'red', message ) );

		// Mark result of this task as invalid.
		process.exit( 1 );
	} );
