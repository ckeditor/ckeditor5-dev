#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
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

const globPattern = path.join( cwd, '@(src|tests)/**/*.js' );

for ( const filePath of glob.sync( globPattern ) ) {
	fs.readFileSync( filePath, 'utf-8' )
		.split( '\n' )
		.forEach( line => {
			// Find required package name.
			let packageName = /^import .* from '(@ckeditor\/[^/]+)\/.*/.exec( line );

			if ( !packageName ) {
				return;
			}

			packageName = packageName[ 1 ];

			// Current package cannot be added as dependency.
			if ( currentPackageName === packageName ) {
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

if ( invalidFiles.size ) {
	console.error( '\n' + '='.repeat( 120 ) );
	console.error( '\nThe files listed below require dependencies which are not defined in "package.json":\n' );
	console.error( [ ...invalidFiles ].map( formatLine ).join( '\n' ) + '\n' );

	if ( missingDependencies.size ) {
		console.error( 'Missing dependencies:\n' );
		console.error( [ ...missingDependencies ].map( formatLine ).join( '\n' ) + '\n' );
	}

	if ( missingDevDependencies.size ) {
		console.error( 'Missing dev-dependencies:\n' );
		console.error( [ ...missingDevDependencies ].map( formatLine ).join( '\n' ) + '\n' );
	}
	console.error( '='.repeat( 120 ) + '\n' );

	throw new Error( 'Some of the files require dependencies which are not defined in "package.json".' );
}

function formatLine( line ) {
	return '  - ' + line;
}
