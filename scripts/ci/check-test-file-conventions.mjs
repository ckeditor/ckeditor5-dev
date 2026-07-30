/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { glob } from 'glob';
import fs from 'fs-extra';

const ROOT_DIRECTORY = upath.join( import.meta.dirname, '..', '..' );

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

const findFiles = ( patterns, ignore = [] ) => glob( patterns, {
	cwd: ROOT_DIRECTORY,
	nodir: true,
	ignore: [ ...NEVER_SCANNED, ...ignore ]
} );

const errors = [];

/**
 * Tests already live in a `tests/` directory, so repeating it in the file name is redundant.
 */
const suffixedFiles = await findFiles( TEST_DIRECTORIES.map(
	pattern => pattern.replace( `/**/*.${ SCRIPT_EXTENSIONS }`, `/**/*.@(test|spec).${ SCRIPT_EXTENSIONS }` )
) );

if ( suffixedFiles.length ) {
	errors.push( [
		'The following test files use a redundant `.test` or `.spec` suffix:',
		...suffixedFiles.sort().map( file => `  ${ file }\n    → rename it to ${ file.replace( /\.(test|spec)\.([^.]+)$/, '.$2' ) }` )
	].join( '\n' ) );
}

/**
 * A file importing `vitest` from outside a test directory is never collected by any Vitest
 * project, so its assertions silently never run.
 */
const nonTestFiles = await findFiles( `**/*.${ SCRIPT_EXTENSIONS }`, TEST_DIRECTORIES );

const misplacedFiles = [];

for ( const file of nonTestFiles ) {
	if ( VITEST_IMPORT.test( await fs.readFile( upath.join( ROOT_DIRECTORY, file ), 'utf8' ) ) ) {
		misplacedFiles.push( file );
	}
}

if ( misplacedFiles.length ) {
	errors.push( [
		'The following files import `vitest` but are not located in a test directory, so they are never executed:',
		...misplacedFiles.sort().map( file => `  ${ file }` ),
		'',
		'Move them to the `tests/` directory of their package, or to `scripts-tests/` for internal scripts.'
	].join( '\n' ) );
}

if ( errors.length ) {
	console.log( 'Test file conventions are not met.\n' );
	console.log( errors.join( '\n\n' ) );

	process.exit( 1 );
}

console.log( 'All test files follow the naming and location conventions.' );
