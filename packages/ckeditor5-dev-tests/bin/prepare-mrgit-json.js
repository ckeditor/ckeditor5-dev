#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const TEST_DIR_PATH = process.argv[ 2 ];

if ( !TEST_DIR_PATH ) {
	throw new Error( 'The script requires one parameter: a path to the testing directory.' );
}

const path = require( 'path' );
const createMrGitJsonContent = require( '../lib/bin/createmrgitjsoncontent' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

tools.updateJSONFile( path.join( TEST_DIR_PATH, 'mrgit.json' ), () => {
	const originalPackageJson = require( path.join( process.cwd(), 'package.json' ) );
	const testingPackageJson = require( path.join( TEST_DIR_PATH, 'package.json' ) );

	return createMrGitJsonContent( testingPackageJson, {
		packageName: originalPackageJson.name,
		// For PR build we want to get the latest commit from given PR instead of Merge Commit.
		// See: https://github.com/ckeditor/ckeditor5-dev/issues/484
		commit: process.env.TRAVIS_PULL_REQUEST_SHA || process.env.TRAVIS_COMMIT,
		// Specify a repository that provides the package specified as `packageName` and which should be cloned.
		// Forked repositories should be able to execute the test scenario as well.
		// See: https://github.com/ckeditor/ckeditor5-dev/issues/542.
		repository: process.env.TRAVIS_PULL_REQUEST_SLUG || process.env.TRAVIS_REPO_SLUG
	} );
} );
