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
	const { coverage } = parseArguments( process.argv.slice( 2 ) );

	const packages = globSync( './packages/*/package.json' )
		.map( packageJsonPath => ( {
			relativePath: path.join( packageJsonPath, '..' ),
			packageJson: fs.readJsonSync( packageJsonPath )
		} ) )
		.reverse();

	const testablePackages = packages.filter( item => isTestable( item.packageJson ) );
	const ignoredPackages = packages.filter( item => !testablePackages.find( testable => item.relativePath === testable.relativePath ) );

	for ( const { relativePath, packageJson } of testablePackages ) {
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
 * @param {Array.<string>} args
 * @returns {object} result
 * @returns {boolean} result.coverage
 */
function parseArguments( args ) {
	const config = {
		boolean: [
			'coverage'
		],

		default: {
			coverage: false
		}
	};

	return minimist( args, config );
}
