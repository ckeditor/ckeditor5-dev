/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Converts values of --files argument to proper globs.
 * There are 5 supported types of values now:
 *
 * 0. current package's tests (when run in context of a package – e.g. on CI) - '/'
 * 1. all packages' files – '*'
 * 2. given package files – 'engine'
 * 3. everything except the given package – '!engine'
 * 4. path – 'engine/view' -> 'ckeditor5-engine/tests/view/**\/*.js'
 * 5. simplified glob – 'engine/view/**\/*.js' -> 'ckeditor5-engine/tests/view/**\/*.js'
 *
 * @param {String} fileOption A path or pattern to determine the tests to execute.
 * @param {Boolean} [isManualTest=false] Whether the tests are manual or automated.
 * @returns {String}
 */
module.exports = function transformFileOptionToTestGlob( fileOption, isManualTest = false ) {
	const path = require( 'path' );
	const nodeModulesPath = path.join( process.cwd(), 'packages' );

	const chunks = fileOption.split( '/' );
	const packageName = chunks.shift();
	let globSuffix = path.join( 'tests', '**' );

	if ( isManualTest ) {
		globSuffix += path.sep + path.join( 'manual', '**' );
	}

	globSuffix += path.sep + '*.js';

	// 0.
	if ( fileOption === '/' ) {
		return path.join( process.cwd(), globSuffix );
	}

	// 1. 2. 3.
	if ( chunks.length === 0 ) {
		// 1.
		if ( packageName == '*' ) {
			return path.join( nodeModulesPath, 'ckeditor5-*', globSuffix );
		}

		// 3.
		if ( packageName.startsWith( '!' ) ) {
			return path.join( nodeModulesPath, 'ckeditor5-!(' + packageName.slice( 1 ) + ')*', globSuffix );
		}

		// 2.
		return path.join( nodeModulesPath, 'ckeditor5-' + packageName, globSuffix );
	}

	let glob = chunks.join( path.sep );

	// 4.
	if ( !glob.endsWith( '.js' ) ) {
		glob = path.join( glob, '**', '*.js' );
	}

	// 5.
	return path.join( nodeModulesPath, 'ckeditor5-' + packageName, 'tests', glob );
};
