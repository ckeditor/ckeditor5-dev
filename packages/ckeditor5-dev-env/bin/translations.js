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
	 * Collects translation strings ( from `t()` calls ) and stores them in ckeditor5/build/.transifex directory.
	 */
	collect() {
		// TODO - ignore-errors flag.
		const createPotFiles = require( '../lib/translations/createpotfiles' );
		const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
		const ignoreErrors = false;

		if ( !ignoreErrors ) {
			logger.on( 'error', errorMessage => {
				throw new Error( errorMessage );
			} );
		}

		createPotFiles( {
			sourceFiles: getCKEditor5SourceFiles(),
			packagePaths: getCKEditor5PackagePaths(),
			corePackagePath: 'packages/ckeditor5-core',
			logger
		} );
	},

	/**
	 * Uploads translation strings on the Transifex server.
	 *
	 * @returns {Promise}
	 */
	upload() {
		const uploadTranslations = require( './../lib/translations/upload' );
		const getToken = require( './../lib/translations/gettoken' );

		return getToken()
			.then( credentials => uploadTranslations( credentials ) );
	},

	/**
	 * Download translations from the Transifex server.
	 *
	 * @returns {Promise}
	 */
	download() {
		const downloadTranslations = require( './../lib/translations/download' );
		const getToken = require( './../lib/translations/gettoken' );

		return getToken()
			.then( credentials => downloadTranslations( credentials ) );
	}
};

const taskNames = Object.keys( tasks );

if ( !task || !tasks[ task ] ) {
	console.log( `Please provide valid task name. Available tasks: ${ taskNames.map( task => chalk.bold( task ) ).join( ', ' ) }.` );

	process.exit( 1 );
}

tasks[ task ]();

function getCKEditor5SourceFiles() {
	const glob = require( 'glob' );
	const srcPaths = [ process.cwd(), 'packages', '*', 'src', '**', '*.js' ].join( '/' );

	return glob.sync( srcPaths ).filter( srcPath => !srcPath.match( /packages\/[^/]+\/src\/lib\// ) );
}

function getCKEditor5PackagePaths() {
	const path = require( 'path' );
	const fs = require( 'fs' );
	const ckeditor5PackagesDir = path.join( process.cwd(), 'packages' );

	return fs.readdirSync( ckeditor5PackagesDir )
		.map( packageName => path.join( ckeditor5PackagesDir, packageName ) );
}
