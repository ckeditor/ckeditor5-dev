#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const path = require( 'path' );
const { execSync } = require( 'child_process' );
const fs = require( 'fs-extra' );
const { globSync } = require( 'glob' );
const minimist = require( 'minimist' );
const chalk = require( 'chalk' );

main();

function main() {
	let hasError = false;
	const cwd = process.cwd();
	const coverageFile = path.join( cwd, 'coverage', 'lcov.info' );
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
		console.log( chalk.bold.magenta( `\nRunning tests for "${ chalk.underline( packageJson.name ) }"...` ) );
		const testScript = coverage ? 'coverage' : 'test';

		try {
			execSync( `npm run  --silent ${ testScript }`, {
				stdio: 'inherit',
				cwd: path.join( cwd, relativePath )
			} );
		} catch ( error ) {
			hasError = true;
		}
	}

	if ( coverage ) {
		fs.emptyDirSync( path.join( coverageFile, '..' ) );
		fs.ensureFileSync( path.join( coverageFile ) );

		// Merge separate reports into a single file that would be sent to Coveralls.
		for ( const lcovPath of globSync( './packages/*/coverage/lcov.info' ) ) {
			const relativePackagePath = path.join( lcovPath, '..', '..' );
			const content = fs.readFileSync( lcovPath, 'utf-8' )
				.replaceAll( /^(SF:)/gm, `$1${ relativePackagePath }/` );

			fs.writeFileSync( coverageFile, content, { flag: 'as' } );
		}

		console.log( chalk.cyan( `\nCoverage status stored in "${ chalk.underline( coverageFile ) }".` ) );
	}

	if ( ignoredPackages.length ) {
		console.log( chalk.yellow( '\nThe following packages do not define tests:' ) );

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
 * @returns {Boolean}
 */
function isTestable( packageJson ) {
	return !!packageJson?.scripts?.test;
}

/**
 * @param {Array.<String>} args
 * @returns {Object} result
 * @returns {Boolean} result.coverage
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
