#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const compiler = require( '@ckeditor/ckeditor5-dev-compiler' );
const tests = require( '../lib/index' );

const options = tests.utils.parseArguments();

options.packages = compiler.utils.getPackages( process.cwd() );

if ( !options.files ) {
	options.files = [
		tests.utils.getPackageName()
	];
}

tests.tasks.test( options );
