#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const tests = require( '../lib/index' );

const cwd = process.cwd();
const options = tests.parseArguments( process.argv.slice( 2 ) );

if ( options.files.length === 0 ) {
	if ( cwd.endsWith( 'ckeditor5' ) ) {
		options.files = [ '*' ];
	} else {
		options.files = [ '/' ];
	}
}

// "Lark" is the default theme for tests.
options.themePath = require.resolve( '@ckeditor/ckeditor5-theme-lark' );

tests.runAutomatedTests( options )
	.catch( error => {
		// Mark result of this task as invalid.
		process.exitCode = 1;

		console.log( chalk.red( error ) );
	} );
