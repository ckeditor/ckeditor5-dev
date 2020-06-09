#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );

const task = process.argv[ 2 ];

const tasks = {
	/**
	 * Collects translation messages (from `t()` calls and context files) and stores them in the `ckeditor5/build/.transifex` directory.
	 */
	collect() {
		const createPotFiles = require( '../lib/translations/createpotfiles' );
		const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();

		createPotFiles( {
			sourceFiles: getCKEditor5SourceFiles(),
			packagePaths: getCKEditor5PackagePaths(),
			corePackagePath: 'packages/ckeditor5-core',
			logger
		} );
	},

	/**
	 * Uploads translation messages on the Transifex server.
	 *
	 * @returns {Promise}
	 */
	async upload() {
		const uploadPotFiles = require( './../lib/translations/upload' );
		const getToken = require( './../lib/translations/gettoken' );

		const token = await getToken();

		await uploadPotFiles( {
			token
		} );
	},

	/**
	 * Download translations from the Transifex server.
	 *
	 * @returns {Promise}
	 */
	async download() {
		const downloadTranslations = require( './../lib/translations/download' );
		const getToken = require( './../lib/translations/gettoken' );
		const path = require( 'path' );

		const token = await getToken();

		const packages = new Map( getCKEditor5PackageNames().map( packageName => [
			packageName,
			path.join( 'packages', packageName )
		] ) );

		await downloadTranslations( { token, packages } );
	}
};

const taskNames = Object.keys( tasks );

if ( !task || !tasks[ task ] ) {
	console.log( `Please provide valid task name. Available tasks: ${ taskNames.map( task => chalk.bold( task ) ).join( ', ' ) }.` );

	process.exit( 1 );
}

Promise.resolve()
	.then( () => tasks[ task ]() )
	.catch( err => {
		console.error( err );

		process.exit( 1 );
	} );

function getCKEditor5SourceFiles() {
	const glob = require( 'glob' );
	const srcPaths = [ process.cwd(), 'packages', '*', 'src', '**', '*.js' ].join( '/' );

	return glob.sync( srcPaths ).filter( srcPath => !srcPath.match( /packages\/[^/]+\/src\/lib\// ) );
}

function getCKEditor5PackagePaths() {
	const path = require( 'path' );

	return getCKEditor5PackageNames()
		.map( packageName => path.join( 'packages', packageName ) );
}

function getCKEditor5PackageNames() {
	const path = require( 'path' );
	const fs = require( 'fs' );
	const ckeditor5PackagesDir = path.join( process.cwd(), 'packages' );

	return fs.readdirSync( ckeditor5PackagesDir );
}
