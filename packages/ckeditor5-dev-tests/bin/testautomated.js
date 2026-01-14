#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { styleText } from 'node:util';
import { fileURLToPath } from 'node:url';
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
		console.log( styleText( 'red', error ) );

		process.exit( 1 );
	} );
