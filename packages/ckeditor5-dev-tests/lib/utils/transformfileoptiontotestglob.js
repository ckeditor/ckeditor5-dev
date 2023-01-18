/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

const EXTERNAL_DIR_PATH = path.join( process.cwd(), 'external' );

/**
 * Converts values of `--files` argument to proper globs. These are the supported types of values:
 *  * "ckeditor5" - matches all root package tests.
 *  * "<external-package-name>" - matches tests in root of external package.
 *  * "*" - matches all packages' files.
 *  * "foo"  - matches all tests from a package.
 *  * "!foo" - matches all tests except from a package.
 *  * "foo/bar/" - matches all tests from a package and a subdirectory.
 *  * "foo/bar" - matches all tests from a package (or root) with specific filename.
 *
 * @param {String} pattern A path or pattern to determine the tests to execute.
 * @param {Boolean} [isManualTest=false] Whether the tests are manual or automated.
 * @returns {Array.<String>}
 */
module.exports = function transformFileOptionToTestGlob( pattern, isManualTest = false ) {
	if ( doesPatternMatchExternalRepositoryName( pattern ) ) {
		return getExternalRepositoryGlob( pattern, { isManualTest } );
	}

	// Directory to look: `packages/ckeditor5-*/...`.
	const transformedPath = transformSinglePattern( pattern, { isManualTest } );

	// Directory to look: `packages/ckeditor-*/...`.
	const transformedPathWithCKEditorPrefix = transformSinglePattern( pattern, { isManualTest, useCKEditorPrefix: true } );

	// Directory to look: `external/*/packages/ckeditor5-*/...`.
	const transformedPathForExternalPackages = transformSinglePattern( pattern, { isManualTest, externalPackages: true } );

	// Directory to look: `external/*/packages/ckeditor-*/...`.
	const transformedPathForExternalPackagesWithCKEditorPrefix = transformSinglePattern( pattern, {
		isManualTest,
		externalPackages: true,
		useCKEditorPrefix: true
	} );

	// Return only unique records.
	return [
		...new Set( [
			transformedPath,
			transformedPathWithCKEditorPrefix,
			transformedPathForExternalPackages,
			transformedPathForExternalPackagesWithCKEditorPrefix
		] )
	];
};

/**
 * @param {String} pattern
 * @param {Object} [options]
 * @param {Boolean} [options.isManualTest] Controlls the path for manual and automated tests.
 * @returns {Array.<String>}
 */
function getExternalRepositoryGlob( pattern, { isManualTest } ) {
	const repositoryGlob = isManualTest ?
		path.join( EXTERNAL_DIR_PATH, pattern, 'tests', 'manual', '**', '*' ) + '.js' :
		path.join( EXTERNAL_DIR_PATH, pattern, 'tests', '**', '*' ) + '.js';

	return [
		repositoryGlob.split( path.sep ).join( path.posix.sep )
	];
}

/**
 * @param {String} pattern
 * @returns {Boolean}
 */
function doesPatternMatchExternalRepositoryName( pattern ) {
	if ( !fs.existsSync( EXTERNAL_DIR_PATH ) ) {
		return false;
	}

	return fs.readdirSync( EXTERNAL_DIR_PATH )
		.filter( externalDir => fs.statSync( path.join( EXTERNAL_DIR_PATH, externalDir ) ).isDirectory() )
		.includes( pattern );
}

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
