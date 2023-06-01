#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const path = require( 'path' );
const tests = require( '../lib/index' );

const options = tests.parseArguments( process.argv.slice( 2 ) );

if ( options.files.length === 0 ) {
	if ( options.cwd.endsWith( 'ckeditor5' ) ) {
		options.files = [ '*' ];
	} else {
		options.files = [ '/' ];
	}
}

// "Lark" is the default theme for tests.
options.themePath = path.resolve( options.cwd, 'packages', 'ckeditor5-theme-lark', 'theme', 'theme.css' );

tests.runAutomatedTests( options )
	.then( () => {
		process.exit( 0 );
	} )
	.catch( error => {
		console.log( chalk.red( error ) );

		process.exit( 1 );
	} );
