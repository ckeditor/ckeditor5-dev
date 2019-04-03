/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
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
	const globSep = '/';
	const cwdChunks = process.cwd().split( path.sep );
	const packagesPathChunks = cwdChunks.concat( [ 'packages' ] );
	const chunks = fileOption.split( globSep );
	const packageName = chunks.shift();
	const globSuffix = [ 'tests', '**' ];
	let returnChunks = [];

	if ( isManualTest ) {
		globSuffix.push( 'manual', '**' );
	}

	globSuffix.push( '*.js' );

	// 0.
	if ( fileOption === '/' ) {
		returnChunks = cwdChunks.concat( globSuffix );
	} else if ( chunks.length === 0 ) {
		// 1.
		if ( packageName == '*' ) {
			returnChunks = packagesPathChunks.concat( [ 'ckeditor5-*' ], globSuffix );
		}

		// 3.
		if ( packageName.startsWith( '!' ) ) {
			returnChunks = packagesPathChunks.concat( [ 'ckeditor5-!(' + packageName.slice( 1 ) + ')*' ], globSuffix );
		} else {
			// 2.
			returnChunks = packagesPathChunks.concat( [ 'ckeditor5-' + packageName ], globSuffix );
		}
	} else {
		// 5.
		returnChunks = packagesPathChunks.concat( [ 'ckeditor5-' + packageName, 'tests' ], chunks );

		if ( !chunks[ chunks.length - 1 ].endsWith( '.js' ) ) {
			// 4.
			returnChunks.push( '**', '*.js' );
		}
	}

	return returnChunks.join( globSep );
};
