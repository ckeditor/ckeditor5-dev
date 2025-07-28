/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import path from 'path';

const EXTERNAL_DIR_NAME = 'external';

/**
 * Converts values of `--files` argument to proper globs. Handles both JS and TS files. These are the supported types of values:
 *  * "ckeditor5" - matches all root package tests.
 *  * "<external-package-name>" - matches tests in root of external package.
 *  * "*" - matches all packages' files.
 *  * "foo"  - matches all tests from a package.
 *  * "ckeditor5-foo" - matches all tests from a package (full package name).
 *  * "!foo" - matches all tests except from a package.
 *  * "foo/bar/" - matches all tests from a package and a subdirectory.
 *  * "foo/bar" - matches all tests from a package (or root) with specific filename.
 *
 * @param {string} pattern A path or pattern to determine the tests to execute.
 * @param {boolean} [isManualTest=false] Whether the tests are manual or automated.
 * @returns {Array.<string>}
 */
export default function transformFileOptionToTestGlob( pattern, isManualTest = false ) {
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
}

/**
 * @param {string} pattern
 * @param {object} [options]
 * @param {boolean} [options.isManualTest] Controlls the path for manual and automated tests.
 * @returns {Array.<string>}
 */
function getExternalRepositoryGlob( pattern, { isManualTest } ) {
	const externalPath = path.join( process.cwd(), EXTERNAL_DIR_NAME );

	const repositoryGlob = isManualTest ?
		path.join( externalPath, pattern, 'tests', 'manual', '**', '*' ) + '.{js,ts}' :
		path.join( externalPath, pattern, 'tests', '**', '*' ) + '.{js,ts}';

	return [
		repositoryGlob.split( path.sep ).join( path.posix.sep )
	];
}

/**
 * @param {string} pattern
 * @returns {boolean}
 */
function doesPatternMatchExternalRepositoryName( pattern ) {
	const externalPath = path.join( process.cwd(), EXTERNAL_DIR_NAME );

	if ( !fs.existsSync( externalPath ) ) {
		return false;
	}

	return fs.readdirSync( externalPath )
		.filter( externalDir => fs.statSync( path.join( externalPath, externalDir ) ).isDirectory() )
		.includes( pattern );
}

/**
 * @param {string} pattern
 * @param {object} [options={}]
 * @param {boolean} [options.isManualTest=false] Whether the tests are manual or automated.
 * @param {boolean} [options.useCKEditorPrefix=false] If true, the returned path will use 'ckeditor' prefix instead of 'ckeditor5'.
 * @param {boolean} [options.externalPackages] If true, the returned path will contain "external\/**\/packages".
 * @returns {string}
 */
function transformSinglePattern( pattern, options ) {
	const isFullPackageName = /^!?ckeditor5?-/.test( pattern );
	const chunks = pattern.match( /[a-z1-9|*-]+/g );
	const output = [];

	const isExclusionPattern = pattern.startsWith( '!' );
	const isFilenamePattern = pattern.includes( '/' ) && !pattern.endsWith( '/' );

	const prefix = options.useCKEditorPrefix ? 'ckeditor' : 'ckeditor5';
	const packagesDirectory = options.externalPackages ? [ 'external', '*', 'packages' ] : [ 'packages' ];
	const packageName = isExclusionPattern ? `!(${ chunks.shift() })*` : chunks.shift();
	const filename = isFilenamePattern ? chunks.pop() : '*';

	output.push( ...process.cwd().split( path.sep ) );

	if ( packageName === 'ckeditor5' || isFullPackageName ) {
		output.push( ...packagesDirectory, packageName );
	} else {
		output.push( ...packagesDirectory, `${ prefix }-${ packageName }` );
	}

	output.push( 'tests' );

	if ( options.isManualTest ) {
		output.push( 'manual' );
	}

	output.push( ...chunks, '**', `${ filename }.{js,ts}` );

	return output.join( path.posix.sep );
}
