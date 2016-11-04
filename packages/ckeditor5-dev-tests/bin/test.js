#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const compiler = require( '@ckeditor/ckeditor5-dev-compiler' );
const tests = require( '../lib/index' );

const cwd = process.cwd();
const options = tests.utils.parseArguments();

options.packages = compiler.utils.getPackages( cwd );

if ( options.files.length === 0 ) {
	options.files = [
		tests.utils.getPackageName()
	];

	// Add current package as source.
	options.packages.push( cwd );
}

tests.tasks.test( options );
