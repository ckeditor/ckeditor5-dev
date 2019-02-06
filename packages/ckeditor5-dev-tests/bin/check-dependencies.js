#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const glob = require( 'glob' );

const cwd = process.cwd();
const packageJson = require( path.join( cwd, 'package.json' ) );
const currentPackageName = packageJson.name;

const dependencies = Object.keys( packageJson.dependencies || {} );
const devDependencies = Object.keys( packageJson.devDependencies || {} );

const missingDependencies = new Set();
const missingDevDependencies = new Set();
const invalidFiles = new Set();
const invalidImportsItself = new Set();

const globPattern = path.join( cwd, '@(src|tests)/**/*.js' );

for ( const filePath of glob.sync( globPattern ) ) {
	// Skip "src/lib" directory.
	if ( filePath.match( /\/src\/lib\// ) ) {
		continue;
	}

	const fileContent = fs.readFileSync( filePath, 'utf-8' );
	const matchedImports = fileContent.match( /^import[^;]+from '(@ckeditor\/[^/]+)[^']+';/mg );

	if ( !matchedImports ) {
		continue;
	}

	matchedImports
		.forEach( importLine => {
			const matchedImport = importLine.match( /(@ckeditor\/[^/]+)/ );

			if ( !matchedImport ) {
				return;
			}

			const packageName = matchedImport[ 1 ];

			// Current package should use relative links to itself.
			if ( currentPackageName === packageName ) {
				invalidImportsItself.add( filePath.replace( cwd + '/', './' ) );

				return;
			}

			// Check whether the package is defined as dependency and dev-dependency.
			const containPackageAsDependency = dependencies.includes( packageName );
			const containPackageAsDevDependency = devDependencies.includes( packageName );

			// If so, current checking line is fine.
			if ( containPackageAsDependency || containPackageAsDevDependency ) {
				return;
			}

			// If found package is missing and current file is "source" file, add the package as a missing dependency.
			if ( !containPackageAsDependency && filePath.match( /\/src\// ) ) {
				missingDependencies.add( packageName );
			}

			// If found package is missing and current file is "test" file, add the package as a missing dev-dependency.
			if ( !containPackageAsDevDependency && filePath.match( /\/tests\// ) ) {
				missingDevDependencies.add( packageName );
			}

			// Mark current file as invalid (it can help for manual debugging).
			invalidFiles.add( filePath.replace( cwd + '/', './' ) );
		} );
}

if ( invalidFiles.size || invalidImportsItself.size ) {
	console.error( '\n' + '='.repeat( 120 ) );

	if ( invalidImportsItself.size ) {
		console.error(
			'\nThe files listed below should use relative paths to import modules ' +
			'from the package in which they are defined:\n'
		);
		console.error( [ ...invalidImportsItself ].map( formatLine ).join( '\n' ) + '\n' );
	}

	if ( invalidFiles.size ) {
		console.error( '\nThe files listed below require dependencies which are not defined in "package.json":\n' );
		console.error( [ ...invalidFiles ].map( formatLine ).join( '\n' ) + '\n' );

		if ( missingDependencies.size ) {
			console.error( 'Missing dependencies:\n' );
			console.error( [ ...missingDependencies ].map( formatLine ).join( '\n' ) + '\n' );
		}

		if ( missingDevDependencies.size ) {
			console.error( 'Missing devDependencies:\n' );
			console.error( [ ...missingDevDependencies ].map( formatLine ).join( '\n' ) + '\n' );
		}
	}

	console.error( '='.repeat( 120 ) );
	process.exit( 1 );
}

function formatLine( line ) {
	return '  - ' + line;
}
