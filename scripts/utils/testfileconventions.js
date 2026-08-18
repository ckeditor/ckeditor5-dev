/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { glob } from 'glob';
import fs from 'fs-extra';

/**
 * Extensions of files that Vitest can collect. Data files (`.json`, `.po`, …) are not checked,
 * so fixtures such as `tests/tsconfig.test.json` are left alone.
 */
const SCRIPT_EXTENSIONS = '@(js|mjs|cjs|jsx|ts|mts|cts|tsx)';

/**
 * Directories holding automated tests. Every `vitest.config.*` in the repository collects tests
 * from its package `tests/` directory, and the internal scripts are covered by `scripts-tests/`.
 */
const TEST_DIRECTORIES = [
	`packages/*/tests/**/*.${ SCRIPT_EXTENSIONS }`,
	`scripts-tests/**/*.${ SCRIPT_EXTENSIONS }`
];

const NEVER_SCANNED = [
	'**/node_modules/**',
	'**/dist/**',
	'**/release/**',
	'**/coverage/**'
];

/**
 * Matches an import of the `vitest` module itself. Sub-paths (`vitest/config`, `vitest/node`) are
 * tooling entry points used by configuration files, hence they must not be matched.
 */
const VITEST_IMPORT = /(?:from|import|require\()\s*'vitest'/;

/**
 * Finds test files that do not follow the repository conventions:
 *
 * * files inside a test directory must not repeat the `.test` or `.spec` suffix,
 * * files importing `vitest` must live inside a test directory, otherwise they are never collected.
 *
 * @param {string} cwd Directory to scan.
 * @returns {Promise.<{suffixedFiles: Array.<string>, misplacedFiles: Array.<string>}>}
 */
export async function findTestFileConventionViolations( cwd ) {
	const findFiles = async ( patterns, ignore = [] ) => {
		const files = await glob( patterns, {
			cwd,
			nodir: true,
			ignore: [ ...NEVER_SCANNED, ...ignore ]
		} );

		return files.map( file => upath.toUnix( file ) ).sort();
	};

	const suffixedFiles = await findFiles( TEST_DIRECTORIES.map(
		pattern => pattern.replace( `/**/*.${ SCRIPT_EXTENSIONS }`, `/**/*.@(test|spec).${ SCRIPT_EXTENSIONS }` )
	) );

	const nonTestFiles = await findFiles( `**/*.${ SCRIPT_EXTENSIONS }`, TEST_DIRECTORIES );

	const misplacedFiles = [];

	for ( const file of nonTestFiles ) {
		if ( VITEST_IMPORT.test( await fs.readFile( upath.join( cwd, file ), 'utf8' ) ) ) {
			misplacedFiles.push( file );
		}
	}

	return { suffixedFiles, misplacedFiles };
}

/**
 * Turns violations into a human-readable report. Returns an empty string if there are none.
 *
 * @param {{suffixedFiles: Array.<string>, misplacedFiles: Array.<string>}} violations
 * @returns {string}
 */
export function formatViolations( { suffixedFiles, misplacedFiles } ) {
	const errors = [];

	if ( suffixedFiles.length ) {
		errors.push( [
			'The following test files use a redundant `.test` or `.spec` suffix:',
			...suffixedFiles.map( file => `  ${ file }\n    → rename it to ${ file.replace( /\.(test|spec)\.([^.]+)$/, '.$2' ) }` )
		].join( '\n' ) );
	}

	if ( misplacedFiles.length ) {
		errors.push( [
			'The following files import `vitest` but are not located in a test directory, so they are never executed:',
			...misplacedFiles.map( file => `  ${ file }` ),
			'',
			'Move them to the `tests/` directory of their package, or to `scripts-tests/` for internal scripts.'
		].join( '\n' ) );
	}

	return errors.join( '\n\n' );
}
