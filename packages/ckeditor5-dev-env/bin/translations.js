#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
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
		const collectTranslations = require( './../lib/translations/collect' );

		collectTranslations();
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
