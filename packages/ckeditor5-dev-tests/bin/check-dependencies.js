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
const nonExistingCSSFiles = [];

const depCheckOptions = {
	// We need to add all values manually because if we modify it, the rest is being lost.
	parsers: {
		'*.css': parsePostCSS,
		'*.js': depCheck.parser.es6,
		'*.jsx': depCheck.parser.jsx,
		'*.ts': depCheck.parser.typescript,
		'*.vue': depCheck.parser.vue
	},
	ignoreDirs: [ 'docs', 'build' ],
	ignoreMatches: [ 'eslint', 'eslint-plugin-ckeditor5-rules', 'husky', 'lint-staged', 'webpack-cli' ]
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
			// We need to remove packages which are already defined as `missing`.
			// `unused.dependencies` lists packages used by JS files. It does not touch CSS files where
			// a package can be used.
			unused.dependencies
				.filter( entry => missingPackages.dependencies.includes( entry ) )
				.map( entry => '- ' + entry )
				.join( '\n' ),

			// Unused devDependencies.
			// We need to remove packages listed as `unused.dependencies` in order to avoid duplicating them.
			// Also, we need to filter `unused.devDependencies`. See `unused.dependencies` in order to know why.
			unused.devDependencies
				.filter( entry => missingPackages.dependencies.includes( entry ) )
				.filter( packageName => !unused.dependencies.includes( packageName ) )
				.map( entry => '- ' + entry )
				.join( '\n' ),

			// Relative CSS imports (files do not exist).
			nonExistingCSSFiles
				.map( entry => {
					return `- "${ chalk.italic( entry.file ) }" imports "${ chalk.italic( entry.import ) }"`;
				} )
				.join( '\n' )
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

		if ( data[ 5 ] ) {
			console.log( chalk.yellow( 'Importing CSS files that do not exist:' ) );
			console.log( data[ 5 ] + '\n' );
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
 * @returns {Object.<String, Array.<String>}
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

/**
 * Checks whether all packages that have been imported by the CSS file are defined in `package.json` as `dependencies`.
 * Returned array contains list of missing packages.
 *
 * @param {String} fileContent Content of the checking file.
 * @param {String} filePath An absolute path to the checking file.
 * @param {Array.<String>} dependencies Merged list of dependencies and devDependencies.
 * @returns {Array.<String>|undefined}
 */
function parsePostCSS( fileContent, filePath, dependencies ) {
	const matchedImports = fileContent.match( /^@import "[^"]+";/mg );

	if ( !matchedImports ) {
		return;
	}

	const missingPackages = new Set();

	matchedImports
		.map( importLine => {
			const importedFile = importLine.match( /"([^"]+)"/ )[ 1 ];

			// Scoped package.
			// @import "@foo/bar/...";
			// @import "@foo/bar"; and its package.json: { "main": "foo-bar.css" }
			if ( importedFile.startsWith( '@' ) ) {
				return {
					type: 'package',
					name: importedFile.split( '/' ).slice( 0, 2 ).join( '/' )
				};
			}

			// Relative import.
			// @import "./file.css"; or @import "../file.css";
			if ( importedFile.startsWith( './' ) || importedFile.startsWith( '../' ) ) {
				return {
					type: 'file',
					path: importedFile
				};
			}

			// Non-scoped package.
			return {
				type: 'package',
				name: importedFile.split( '/' )[ 0 ]
			};
		} )
		.forEach( importDetails => {
			// If checked file imports another file, checks whether imported file exists.
			if ( importDetails.type == 'file' ) {
				const fileToImport = path.resolve( filePath, '..', importDetails.path );

				if ( !fs.existsSync( fileToImport ) ) {
					nonExistingCSSFiles.push( {
						file: filePath,
						import: importDetails.path
					} );
				}

				return;
			}

			if ( !dependencies.includes( importDetails.name ) ) {
				missingPackages.add( importDetails.name );
			}
		} );

	return [ ...missingPackages ];
}
