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

// By default, the watch mechanism should be enabled in manual tests.
// However, it makes sense to disable it when a developer wants to compile these files once,
// without rebuilding it. See: https://github.com/ckeditor/ckeditor5/issues/10982.
options.disableWatch = process.argv.includes( '--disable-watch' );

// "Lark" is the default theme for tests.
options.themePath = path.resolve( options.cwd, 'packages', 'ckeditor5-theme-lark', 'theme', 'theme.css' );

tests.runManualTests( options )
	.catch( error => {
		// Mark result of this task as invalid.
		process.exitCode = 1;

		console.log( chalk.red( error ) );
	} );
