#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const gutil = require( 'gulp-util' );
const tests = require( '../lib/index' );

const cwd = process.cwd();
const options = tests.parseArguments( process.argv.slice( 2 ) );

if ( !cwd.endsWith( 'ckeditor5' ) ) {
	options.files.push( '/' );
}

console.log( options.files );

tests.runAutomatedTests( options )
	.catch( ( error ) => {
		// Mark result of this task as invalid.
		process.exitCode = 1;

		gutil.log( gutil.colors.red( error ) );
	} );
