#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const PACKAGE_PATH = process.argv[ 2 ];
const TEST_DIR_PATH = process.argv[ 3 ];

if ( !PACKAGE_PATH || !TEST_DIR_PATH ) {
	throw new Error( 'The script requires two parameters: a path to the package and a path to the testing directory.' );
}

const path = require( 'path' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const packageJson = require( path.join( PACKAGE_PATH, 'package.json' ) );

tools.updateJSONFile( path.join( TEST_DIR_PATH, 'package.json' ), () => {
	const json = {
		name: 'ckeditor5-dev-testing-environment',
		version: '0.0.1',
		description: 'This package is a temporary package used for preparing the testing environment. It is used only for CI.',
		dependencies: packageJson.dependencies,
		devDependencies: packageJson.devDependencies,
		engines: packageJson.engines,
		author: packageJson.author,
		license: packageJson.license,
		homepage: packageJson.homepage,
		repository: packageJson.repository,
		scripts: packageJson.scripts,
		eslintIgnore: packageJson.eslintIgnore,
		private: true,
		workspaces: [
			'packages/*'
		]
	};

	// Add the current testing package as a dependency for the testing-environment.
	json.dependencies[ packageJson.name ] = '^' + packageJson.version;

	return json;
} );
