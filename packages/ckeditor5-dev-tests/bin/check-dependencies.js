#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const glob = require( 'glob' );
const depCheck = require( 'depcheck' );
const chalk = require( 'chalk' );

const cwd = process.cwd();
const packageJson = require( path.join( cwd, 'package.json' ) );

const depCheckOptions = {
	ignoreDirs: [ 'docs', 'build' ],
	ignoreMatches: [ 'eslint', 'husky', 'lint-staged', 'webpack-cli' ]
};

if ( Array.isArray( packageJson.depcheckIgnore ) ) {
	depCheckOptions.ignoreMatches.push( ...packageJson.depcheckIgnore );
}

console.log( 'Checking dependencies...' );

depCheck( cwd, depCheckOptions )
	.then( unused => {
		const missingPackages = groupMissingPackages( unused.missing, packageJson.name );

		const data = [
			// Invalid itself imports.
			[ ...getInvalidItselfImports( cwd ) ]
				.map( entry => '- ' + entry )
				.join( '\n' ),

			// Missing dependencies.
			missingPackages.dependencies
				.map( entry => '- ' + entry )
				.join( '\n' ),

			// Missing devDependencies.
			missingPackages.devDependencies
				.map( entry => '- ' + entry )
				.join( '\n' ),

			// Unused dependencies.
			unused.dependencies
				.map( entry => '- ' + entry )
				.join( '\n' ),

			// Unused devDependencies.
			unused.devDependencies
				.filter( packageName => !unused.dependencies.includes( packageName ) )
				.map( entry => '- ' + entry )
				.join( '\n' ),
		];

		const hasErrors = data.some( entry => !!entry );

		if ( !hasErrors ) {
			console.log( chalk.green( 'All dependencies are defined correctly.' ) );

			return;
		}

		console.log( chalk.red( 'Found some issue with dependencies.\n' ) );

		if ( data[ 0 ] ) {
			console.log( chalk.yellow( 'Invalid itself imports:' ) );
			console.log( data[ 0 ] + '\n' );
		}

		if ( data[ 1 ] ) {
			console.log( chalk.red( 'Missing dependencies:' ) );
			console.log( data[ 1 ] + '\n' );
		}

		if ( data[ 2 ] ) {
			console.log( chalk.red( 'Missing devDependencies:' ) );
			console.log( data[ 2 ] + '\n' );
		}

		if ( data[ 3 ] ) {
			console.log( chalk.cyan( 'Unused dependencies:' ) );
			console.log( data[ 3 ] + '\n' );
		}

		if ( data[ 4 ] ) {
			console.log( chalk.cyan( 'Unused devDependencies:' ) );
			console.log( data[ 4 ] + '\n' );
		}

		process.exit( -1 );
	} );

/**
 * Returns a Set that contains list of files that import modules using full package name instead of relative path.
 *
 * @param repositoryPath An absolute path to the directory which should be ckecked.
 * @returns {Set<String>}
 */
function getInvalidItselfImports( repositoryPath ) {
	const packageJson = require( path.join( repositoryPath, 'package.json' ) );
	const globPattern = path.join( repositoryPath, '@(src|tests)/**/*.js' );
	const invalidImportsItself = new Set();

	for ( const filePath of glob.sync( globPattern ) ) {
		const fileContent = fs.readFileSync( filePath, 'utf-8' );
		const matchedImports = fileContent.match( /^import[^;]+from '(@ckeditor\/[^/]+)[^']+';/mg );

		if ( !matchedImports ) {
			continue;
		}

		matchedImports
			.map( importLine => importLine.match( /(@ckeditor\/[^/]+)/ ) )
			.filter( matchedImport => !!matchedImport )
			.forEach( matchedImport => {
				// Current package should use relative links to itself.
				if ( packageJson.name === matchedImport[ 1 ] ) {
					invalidImportsItself.add( filePath.replace( repositoryPath + '/', '' ) );
				}
			} );
	}

	return invalidImportsItself;
}

/**
 * Groups missing dependencies returned by `depcheck` as `dependencies` or `devDependencies`.
 *
 * @param {Object} missingPackages The `missing` value from object returned by `depcheck`.
 * @param {String} currentPackage Name of current package.
 * @returns {Object.<String, Array.<String>>}
 */
function groupMissingPackages( missingPackages, currentPackage ) {
	delete missingPackages[ currentPackage ];

	const dependencies = [];
	const devDependencies = [];

	for ( const packageName of Object.keys( missingPackages ) ) {
		const isDevDependency = missingPackages[ packageName ].every( absolutePath => absolutePath.match( /tests/ ) );

		if ( isDevDependency ) {
			devDependencies.push( packageName );
		} else {
			dependencies.push( packageName );
		}
	}

	return { dependencies, devDependencies };
}
