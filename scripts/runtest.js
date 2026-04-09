#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'node:path';
import { styleText } from 'node:util';
import { execSync } from 'node:child_process';
import fs from 'fs-extra';
import { globSync } from 'glob';
import minimist from 'minimist';

main();

function main() {
	let hasError = false;
	const cwd = process.cwd();
	const { coverage, files } = parseArguments( process.argv.slice( 2 ) );

	const packages = globSync( './packages/*/package.json' )
		.map( packageJsonPath => ( {
			relativePath: path.join( packageJsonPath, '..' ),
			packageJson: fs.readJsonSync( packageJsonPath )
		} ) )
		.reverse();

	const testablePackages = packages
		.filter( item => isTestable( item.packageJson ) );
	const filteredPackages = testablePackages
		.filter( item => matchesFileFilter( item.packageJson.name, files ) );
	const ignoredPackages = packages
		.filter( item => matchesFileFilter( item.packageJson.name, files ) )
		.filter( item => !testablePackages.find( testable => item.relativePath === testable.relativePath ) );

	for ( const { relativePath, packageJson } of filteredPackages ) {
		console.log( styleText( [ 'bold', 'magenta' ], `\nRunning tests for "${ styleText( 'underline', packageJson.name ) }"...` ) );
		const testScript = coverage ? 'coverage' : 'test';

		try {
			execSync( `npm run --silent ${ testScript }`, {
				stdio: 'inherit',
				cwd: path.join( cwd, relativePath )
			} );
		} catch {
			hasError = true;
		}
	}

	if ( coverage ) {
		execSync( 'node scripts/ci/combine-coverage-lcov.js', {
			cwd,
			stdio: 'inherit'
		} );
	}

	if ( ignoredPackages.length ) {
		console.log( styleText( 'yellow', '\nThe following packages do not define tests:' ) );

		ignoredPackages.forEach( ( { packageJson } ) => {
			console.log( `  - ${ packageJson.name }` );
		} );
	}

	if ( hasError ) {
		process.exit( 1 );
	}
}

/**
 * @param {Object} packageJson
 * @returns {boolean}
 */
function isTestable( packageJson ) {
	return !!packageJson?.scripts?.test;
}

/**
 * @param {string} packageName
 * @param {Array.<string>} filters
 * @returns {boolean}
 */
function matchesFileFilter( packageName, filters ) {
	if ( !filters.length ) {
		return true;
	}

	const shortName = packageName.replace( /^@ckeditor\/ckeditor5-/, '' );

	return filters.some( filter => shortName.includes( filter ) );
}

/**
 * @param {Array.<string>} args
 * @returns {object} result
 * @returns {boolean} result.coverage
 */
function parseArguments( args ) {
	const unknownArgs = [];

	const config = {
		string: [
			'files'
		],

		boolean: [
			'coverage',
			'help'
		],

		alias: {
			f: 'files',
			h: 'help'
		},

		default: {
			coverage: false,
			files: []
		},

		unknown: arg => unknownArgs.push( arg )
	};

	const options = minimist( args, config );

	if ( options.help ) {
		printHelp();
		process.exit( 0 );
	}

	if ( unknownArgs.length ) {
		console.error( `Unknown option${ unknownArgs.length > 1 ? 's' : '' }: ${ unknownArgs.join( ', ' ) }` );
		console.error( 'Run this script with the "--help" option to see all available options.' );
		process.exit( 1 );
	}

	if ( typeof options.files === 'string' ) {
		options.files = options.files.split( ',' );
	}

	return options;
}

/**
 * Prints help text for the CLI command.
 */
function printHelp() {
	const lines = [
		'',
		styleText( 'bold', '  ckeditor5-dev unit tests' ) + ' [options]',
		'',
		'  Runs tests for all testable packages in the repository.',
		'',
		styleText( 'bold', styleText( 'underline', 'Options' ) ),
		'',
		`  ${ styleText( 'yellow', '-f' ) }, ${ styleText( 'yellow', '--files' ) } ${ styleText( 'dim', '<pattern>' ) }` +
		'               Package names without the `@ckeditor/ckeditor5-` prefix to test (comma-separated)',
		`      ${ styleText( 'yellow', '--coverage' ) }                      Generate code coverage report`,
		`  ${ styleText( 'yellow', '-h' ) }, ${ styleText( 'yellow', '--help' ) }                          Show this help message`,
		''
	];

	console.log( lines.join( '\n' ) );
}
