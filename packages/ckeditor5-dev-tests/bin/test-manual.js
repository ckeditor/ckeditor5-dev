#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const path = require( 'path' );
const tests = require( '../lib/index' );

const cwd = process.cwd();
const options = tests.parseArguments( process.argv.slice( 2 ) );

if ( options.files.length === 0 ) {
	// Checks whether the test command was called from the main repository.
	// If so then take all packages files to tests.
	if ( require( path.join( cwd, 'package.json' ) ).name === 'ckeditor5' ) {
		options.files = [ '*', '/' ];
	} else {
	// In other case take files from the current package.
		options.files = [ '/' ];
	}
}

// "Lark" is the default theme for tests.
options.themePath = path.resolve( cwd, 'packages', 'ckeditor5-theme-lark', 'theme', 'theme.css' );

tests.runManualTests( options )
	.catch( error => {
		// Mark result of this task as invalid.
		process.exitCode = 1;

		console.log( chalk.red( error ) );
	} );
