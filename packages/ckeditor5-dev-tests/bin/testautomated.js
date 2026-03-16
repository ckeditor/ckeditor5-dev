#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import { styleText } from 'node:util';
import { fileURLToPath } from 'node:url';
import { loadEnvFile } from 'node:process';
import * as tests from '../lib/index.js';

const options = tests.parseArguments( process.argv.slice( 2 ) );

if ( options.files.length === 0 ) {
	options.files = [ '*' ];
}

// "Lark" is the default theme for tests. The resolution may fail when
// ckeditor5-dev-tests is installed outside the CKEditor 5 workspace
// (e.g. in ckeditor5-commercial where the theme lives in external/ckeditor5).
try {
	options.themePath = fileURLToPath( import.meta.resolve( '@ckeditor/ckeditor5-theme-lark' ) );
} catch {
	// Theme unavailable — Karma tests that import styles will still work
	// if the loader can resolve the theme through other means.
}

if ( fs.existsSync( '.env' ) ) {
	loadEnvFile( '.env' );
}

tests.runAutomatedTests( options )
	.then( () => {
		process.exit( 0 );
	} )
	.catch( error => {
		const message = error instanceof Error ? error.stack : error.toString();
		console.log( styleText( 'red', message ) );

		// Mark result of this task as invalid.
		process.exit( 1 );
	} );
