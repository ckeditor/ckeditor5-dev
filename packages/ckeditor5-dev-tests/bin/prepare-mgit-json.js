#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const TEST_DIR_PATH = process.argv[ 2 ];

if ( !TEST_DIR_PATH ) {
	throw new Error( 'The script requires one parameter: a path to the testing directory.' );
}

const path = require( 'path' );
const createMgitJsonContent = require( '../lib/bin/createmgitjsoncontent' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

tools.updateJSONFile( path.join( TEST_DIR_PATH, 'mgit.json' ), () => {
	const originalPackageJson = require( path.join( process.cwd(), 'package.json' ) );
	const testingPackageJson = require( path.join( TEST_DIR_PATH, 'package.json' ) );

	return createMgitJsonContent( testingPackageJson, {
		packageName: originalPackageJson.name,
		commit: process.env.TRAVIS_COMMIT
	} );
} );
