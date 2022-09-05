/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

// Matches pattern of a single package name, e.g. "engine", "special-characters".
const SINGLE_PACKAGE_REGEXP = /^[a-z][a-z-]+[a-z]$/;
// Matches pattern of a single test path, e.g. "ckeditor5/article", "alignment/alignment".
const SINGLE_TEST_REGEXP = /^[a-z1-9-]+\/[a-z-]+$/;
// Matches pattern of a single excluded package name, e.g. "!engine", "!special-characters".
const EXCLUSION_REGEXP = /^![a-z-]+[a-z]$/;
// Matches pattern of a directory, e.g. "engine/view/", "alignment/alignment/".
const DIRECTORY_REGEXP = /^[a-z]+\/[/a-z-]+\/$/;

/**
 * Converts values of --files argument to proper globs.
 * There are 5 supported types of values now:
 *
 * 0. the main repository - 'ckeditor5'
 * 1. all packages' files – '*'
 * 2. given package files – 'engine'
 * 3. everything except the given package – '!engine'
 * 4. path – 'engine/view/' -> 'ckeditor5-engine/tests/view/**\/*.js'
 * 5. specific test - 'ckeditor5/article'
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
	const rootTests = globPattern === 'ckeditor5' || globPattern.startsWith( 'ckeditor5/' );
	const prefix = options.useCKEditorPrefix ? 'ckeditor' : 'ckeditor5';
	const packagesDirectory = options.externalPackages ? [ 'external', '*', 'packages' ] : [ 'packages' ];

	const chunks = globPattern.match( /[a-z1-9*-]+/g );
	const returnChunks = [];

	// Every path starts with workspace.
	returnChunks.push( ...process.cwd().split( path.sep ) );

	// We add path to packages directory, unless we operate in CKE5 root.
	if ( !rootTests ) {
		let packageName;
		let testDirectories;

		// 1, 2 & 5
		if ( globPattern === '*' || SINGLE_PACKAGE_REGEXP.test( globPattern ) || SINGLE_TEST_REGEXP.test( globPattern ) ) {
			packageName = prefix + '-' + chunks[ 0 ];
			testDirectories = [ '**' ];
		}

		// 3
		if ( EXCLUSION_REGEXP.test( globPattern ) ) {
			packageName = prefix + '-!(' + chunks[ 0 ] + ')*';
			testDirectories = [ '**' ];
		}

		// 4
		if ( DIRECTORY_REGEXP.test( globPattern ) ) {
			packageName = prefix + '-' + chunks.shift();
			testDirectories = [ ...chunks, '**' ];
		}

		returnChunks.push( ...packagesDirectory, packageName, 'tests', ...testDirectories );
	}
	// In case of CKE5 root, we simply append tests directory.
	else {
		returnChunks.push( 'tests', '**' );
	}

	// Subdirectory for manual tests.
	if ( options.isManualTest ) {
		returnChunks.push( 'manual', '**' );
	}

	// If we're looking for a single test, use specific filename.
	if ( SINGLE_TEST_REGEXP.test( globPattern ) ) {
		returnChunks.push( chunks[ 1 ] + '.js' );
	}
	// Otherwise, any filename.
	else {
		returnChunks.push( '*.js' );
	}

	return returnChunks.join( path.posix.sep );
}
