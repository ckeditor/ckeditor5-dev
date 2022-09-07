/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

/**
 * Converts values of --files argument to proper globs.
 * These are the supported types of values:
 *
 * "ckeditor5" - matches all root package tests
 * "*"         - matches all packages' files
 * "foo"       - matches all tests from a package
 * "!foo"      - matches all tests except from a package
 * "foo/bar/"  - matches all tests from a package and a subdirectory
 * "foo/bar"   - matches all tests from a package (or root) with specific filename
 *
 * @param {String} pattern A path or pattern to determine the tests to execute.
 * @param {Boolean} [isManualTest=false] Whether the tests are manual or automated.
 * @returns {Iterable.<String>}
 */
module.exports = function transformFileOptionToTestGlob( pattern, isManualTest = false ) {
	const transformedPath = transformSinglePattern( pattern, { isManualTest } );
	const transformedPathWithCKEditorPrefix = transformSinglePattern( pattern, { isManualTest, useCKEditorPrefix: true } );
	const transformedPathForExternalPackages = transformSinglePattern( pattern, { isManualTest, externalPackages: true } );
	const transformedPathForExternalPackagesWithCKEditorPrefix = transformSinglePattern( pattern, {
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
 * @param {String} pattern
 * @param {Object} [options={}]
 * @param {Boolean} [options.isManualTest=false] Whether the tests are manual or automated.
 * @param {Boolean} [options.useCKEditorPrefix=false] If true, the returned path will use 'ckeditor' prefix instead of 'ckeditor5'.
 * @param {Boolean} [options.externalPackages] If true, the returned path will contain "external\/**\/packages".
 * @returns {String}
 */
function transformSinglePattern( pattern, options ) {
	const chunks = pattern.match( /[a-z1-9|*-]+/g );
	const output = [];

	const isExclusionPattern = pattern.startsWith( '!' );
	const isFilenamePattern = pattern.includes( '/' ) && !pattern.endsWith( '/' );

	const prefix = options.useCKEditorPrefix ? 'ckeditor' : 'ckeditor5';
	const packagesDirectory = options.externalPackages ? [ 'external', '*', 'packages' ] : [ 'packages' ];
	const packageName = isExclusionPattern ? `!(${ chunks.shift() })*` : chunks.shift();
	const filename = isFilenamePattern ? chunks.pop() : '*';

	output.push( ...process.cwd().split( path.sep ) );

	if ( packageName !== 'ckeditor5' ) {
		output.push( ...packagesDirectory, `${ prefix }-${ packageName }` );
	}

	output.push( 'tests' );

	if ( options.isManualTest ) {
		output.push( 'manual' );
	}

	output.push( ...chunks, '**', `${ filename }.js` );

	return output.join( path.posix.sep );
}
