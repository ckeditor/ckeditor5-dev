#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { fileURLToPath } from 'url';
import chalk from 'chalk';
import * as tests from '../lib/index.js';

const options = tests.parseArguments( process.argv.slice( 2 ) );

if ( options.files.length === 0 ) {
	options.files = [ '*' ];
}

// "Lark" is the default theme for tests.
options.themePath = fileURLToPath( import.meta.resolve( '@ckeditor/ckeditor5-theme-lark' ) );

tests.runAutomatedTests( options )
	.then( () => {
		process.exit( 0 );
	} )
	.catch( error => {
		console.log( chalk.red( error ) );

		process.exit( 1 );
	} );
