#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );

const task = process.argv[ 2 ];

const tasks = {
	/**
	 * Generates POT source files from the code and stores them in the 'ckeditor5/build/.transifex' directory.
	 */
	generateSourceFiles() {
		const generateSourceFiles = require( './../lib/translations/generatesourcefiles' );

		generateSourceFiles();
	},

	/**
	 * Uploads source files previously collected in the 'ckeditor5/build/.transifex' directory the Transifex server.
	 *
	 * @returns {Promise}
	 */
	uploadSourceFiles() {
		const uploadTranslations = require( './../lib/translations/uploadsourcefiles' );
		const getToken = require( './../lib/translations/gettoken' );

		return getToken()
			.then( credentials => uploadTranslations( credentials ) );
	},

	/**
	 * Downloads translations from the Transifex server.
	 *
	 * @returns {Promise}
	 */
	downloadTranslations() {
		const downloadTranslations = require( './../lib/translations/downloadtranslations' );
		const getToken = require( './../lib/translations/gettoken' );

		return getToken()
			.then( credentials => downloadTranslations( credentials ) );
	},

	/**
	 * Uploads translations to the Transifex for the given package from translation files
	 * that are saved in the 'ckeditor5/packages/ckeditor5-[packageName]/lang/translations' directory.
	 *
	 * IMPORTANT: Take care, this will overwrite existing translations on the Transifex.
	 *
	 * @returns {Promise}
	 */
	uploadTranslations() {
		const updateTranslations = require( './../lib/translations/uploadtranslations' );
		const getToken = require( './../lib/translations/gettoken' );
		const minimist = require( 'minimist' );

		const args = minimist( process.argv, { string: [ 'package' ] } );

		return getToken()
			.then( credentials => updateTranslations( credentials, args.package ) );
	}
};

const taskNames = Object.keys( tasks );

if ( !task || !tasks[ task ] ) {
	console.log( `Please provide valid task name. Available tasks: ${ taskNames.map( task => chalk.bold( task ) ).join( ', ' ) }.` );

	process.exit( 1 );
}

tasks[ task ]();
