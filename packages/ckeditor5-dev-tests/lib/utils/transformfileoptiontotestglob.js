/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import upath from 'upath';
import { globSync } from 'glob';

/**
 * Converts package names from '--files' argument to glob patterns for test files. Handles both JS and TS files.
 *
 * The function searches for packages in both the main 'packages/' directory and external packages in 'external/*\/packages/'.
 * It supports the following pattern types:
 *
 *  * "foo" - matches all tests from a package named "ckeditor5-foo" or "foo"
 *  * "ckeditor5-foo" - matches all tests from a package with the exact name "ckeditor5-foo"
 *  * "!(package1|package2|...)" - excludes tests from the specified packages (supports multiple packages separated by |)
 *
 * The function automatically strips the "ckeditor5-" prefix from package names for matching,
 * so "foo" will match both "foo" and "ckeditor5-foo" packages.
 *
 * @param {string} pattern A package name or negation pattern to determine which packages' tests to include.
 * @param {boolean} [isManualTest=false] Whether to target manual tests (`tests/manual/`) or automated tests (`tests/`).
 * @returns {Array.<string>} Array of glob patterns that match test files in the specified packages.
 */
export default function transformFileOptionToTestGlob( pattern, isManualTest = false ) {
	const shouldExclude = pattern.startsWith( '!' );

	// In the current implementation we are assuming that pattern is a single package name when it's not negation.
	const packagesToFilter = shouldExclude ? parseNegationArg( pattern ) : [ pattern ];
	const packagesToFilterWithoutPrefix = packagesToFilter.map( packageName => packageName.replace( 'ckeditor5-', '' ) );
	const shouldFilter = pattern !== '*' && packagesToFilterWithoutPrefix.length > 0;

	const testsDirectory = isManualTest ? 'tests/manual' : 'tests';

	const packagesPaths = globSync( [
		upath.join( process.cwd(), 'packages' ),
		upath.join( process.cwd(), 'external', '*', 'packages' )
	] );

	const packages = packagesPaths.flatMap( path =>
		fs.readdirSync( path )
			.filter( directory => shouldFilter ? filterByPackagesNames( directory, packagesToFilterWithoutPrefix, shouldExclude ) : true )
			.map( directory => upath.join( path, directory ) )
	);

	return packages.map( path => `${ path }/${ testsDirectory }/**/*.{js,ts}` );
}

function filterByPackagesNames( directory, packagesToFilter, shouldExclude ) {
	const packageNameWithoutPrefix = directory.replace( 'ckeditor5-', '' );
	const shouldIncludePackage = packagesToFilter.includes( packageNameWithoutPrefix );

	return shouldExclude ? !shouldIncludePackage : shouldIncludePackage;
}

function parseNegationArg( input ) {
	return input.slice( 2, -1 ).split( '|' );
}
