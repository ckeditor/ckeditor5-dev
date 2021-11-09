#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const chalk = require( 'chalk' );

const task = process.argv[ 2 ];
const cwd = process.cwd();

const PROJECT_URL = 'https://www.transifex.com/api/2/project/ckeditor5';

// TODO: Remove this file and create dedicated scripts in the CKEditor 5 project.

const tasks = {
	/**
	 * Collects translation messages (from `t()` calls and context files) and stores them in the `ckeditor5/build/.transifex` directory.
	 *
	 * The script by default does not check the `external/` directory. Add the `--include-external-directory` flag to enable
	 * checking packages located in the directory.
	 */
	collect() {
		const includeExternalDirectory = process.argv.includes( '--include-external-directory' );

		const createPotFiles = require( '../lib/translations/createpotfiles' );
		const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();

		createPotFiles( {
			sourceFiles: getCKEditor5SourceFiles( { includeExternalDirectory } ),
			packagePaths: getCKEditor5PackagePaths( { includeExternalDirectory } ),
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: path.join( cwd, 'build', '.transifex' ),
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
			token,
			url: PROJECT_URL,
			translationsDirectory: path.posix.join( cwd, 'build', '.transifex' )
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

		const token = await getToken();

		const packages = new Map( getCKEditor5PackageNames().map( packageName => [
			packageName,
			path.join( 'packages', packageName )
		] ) );

		await downloadTranslations( {
			token,
			packages,
			cwd,
			url: PROJECT_URL
		} );
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

/**
 * Returns absolute paths to CKEditor 5 sources. By default the function does not check the `external/` directory.
 *
 * @param {Object} options
 * @param {Boolean} options.includeExternalDirectory If set to `true`, files from the `external/` directory will be returned too.
 * @returns {Array.<String>}
 */
function getCKEditor5SourceFiles( { includeExternalDirectory } ) {
	const glob = require( 'glob' );

	const patterns = [
		path.posix.join( process.cwd(), 'packages', '*', 'src', '**', '*.js' )
	];

	if ( includeExternalDirectory ) {
		patterns.push(
			path.posix.join( process.cwd(), 'external', '*', 'packages', '*', 'src', '**', '*.js' )
		);
	}

	const sourceFiles = [];

	for ( const item of patterns ) {
		sourceFiles.push(
			...glob.sync( item ).filter( srcPath => !srcPath.match( /packages\/[^/]+\/src\/lib\// ) )
		);
	}

	return sourceFiles;
}

/**
 * Returns relative paths to CKEditor 5 packages. By default the function does not check the `external/` directory.
 *
 * @param {Object} options
 * @param {Boolean} options.includeExternalDirectory If set to `true`, packages from the `external/` directory will be returned too.
 * @returns {Array.<String>}
 */
function getCKEditor5PackagePaths( { includeExternalDirectory } ) {
	const glob = require( 'glob' );

	const patterns = [
		path.posix.join( 'packages', '* ' )
	];

	if ( includeExternalDirectory ) {
		patterns.push(
			path.posix.join( 'external', '*', 'packages', '*' )
		);
	}

	const packagePaths = [];

	for ( const item of patterns ) {
		packagePaths.push( ...glob.sync( item ) );
	}

	return packagePaths;
}

function getCKEditor5PackageNames() {
	const fs = require( 'fs' );
	const ckeditor5PackagesDir = path.join( process.cwd(), 'packages' );

	return fs.readdirSync( ckeditor5PackagesDir );
}
