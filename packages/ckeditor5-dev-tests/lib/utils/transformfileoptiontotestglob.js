/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Converts values of --files argument to proper globs.
 * These are the supported types of values:
 *
 * 0. the main repository - 'ckeditor5'
 * 1. all packages' files – '*'
 * 2. given package files – 'engine'
 * 3. everything except the given package – '!engine'
 * 4. path – 'engine/view' -> 'ckeditor5-engine/tests/view/**\/*.js'
 * 5. simplified glob – 'engine/view/**\/*.js' -> 'ckeditor5-engine/tests/view/**\/*.js'
 * 6. a glob starting with './', which stays as is - './tests/**\/*.js'
 *
 * @param {String} globPattern A path or pattern to determine the tests to execute.
 * @param {Boolean} [isManualTest=false] Whether the tests are manual or automated.
 * @returns {Iterable.<String>}
 */
module.exports = function transformFileOptionToTestGlob( globPattern, isManualTest = false ) {
	const transformedPath = transformSingleGlobPattern( globPattern, { isManualTest } );
	const transformedPathWithCKEditorPrefix = transformSingleGlobPattern( globPattern, { isManualTest, useCKEditorPrefix: true } );
	const transformedPathForExternalPackages = transformSingleGlobPattern( globPattern, { isManualTest, externalPackages: true } );
	const transformedPathForExternalPackagesWithCKEditorPrefix = transformSingleGlobPattern( globPattern, {
		isManualTest,
		externalPackages: true,
		useCKEditorPrefix: true
	} );

	if (
		transformedPath === transformedPathWithCKEditorPrefix &&
		transformedPathForExternalPackages === transformedPathForExternalPackagesWithCKEditorPrefix &&
		transformedPath === transformedPathForExternalPackages
	) {
		return [ transformedPath ];
	}

	return [
		transformedPath,
		transformedPathWithCKEditorPrefix,
		transformedPathForExternalPackages,
		transformedPathForExternalPackagesWithCKEditorPrefix
	];
};

/**
 * @param {String} globPattern
 * @param {Object} [options={}]
 * @param {Boolean} [options.isManualTest=false] Whether the tests are manual or automated.
 * @param {Boolean} [options.useCKEditorPrefix=false] If true, the returned path will use 'ckeditor' prefix instead of 'ckeditor5'.
 * @param {Boolean} [options.externalPackages] If true, the returned path will contain "external\/**\/packages".
 * @returns {String}
 */
function transformSingleGlobPattern( globPattern, options ) {
	// 6. Support for direct glob to test files.
	if ( globPattern.startsWith( './' ) ) {
		return globPattern;
	}

	const isManualTest = options.isManualTest || false;
	const useCKEditorPrefix = options.useCKEditorPrefix || false;
	const prefix = useCKEditorPrefix ? 'ckeditor' : 'ckeditor5';

	const globSep = '/';
	const cwdChunks = process.cwd().split( require( 'path' ).sep );
	const chunks = globPattern.split( globSep );
	const packageName = chunks.shift();
	const globSuffix = [ 'tests', '**' ];
	let returnChunks = cwdChunks.concat( options.externalPackages ? [ 'external', '*', 'packages' ] : [ 'packages' ] );

	if ( isManualTest ) {
		globSuffix.push( 'manual', '**' );
	}

	globSuffix.push( '*.js' );

	// 0.
	if ( globPattern === 'ckeditor5' ) {
		returnChunks = cwdChunks.concat( globSuffix );
	} else if ( chunks.length === 0 ) {
		// 1.
		if ( packageName == '*' ) {
			returnChunks.push( prefix + '-*', ...globSuffix );
		} else if ( packageName.startsWith( '!' ) ) {
			// 3.
			returnChunks.push( prefix + '-!(' + packageName.slice( 1 ) + ')*', ...globSuffix );
		} else {
			// 2.
			returnChunks.push( prefix + '-' + packageName, ...globSuffix );
		}
	} else {
		// 5.
		returnChunks.push( prefix + '-' + packageName, 'tests', ...chunks );

		if ( !chunks[ chunks.length - 1 ].endsWith( '.js' ) ) {
			// 4.
			returnChunks.push( '**', '*.js' );
		}
	}

	return returnChunks.join( globSep );
}
