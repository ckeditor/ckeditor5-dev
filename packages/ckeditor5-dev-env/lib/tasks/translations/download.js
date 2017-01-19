/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const transifexAPI = require( './transifex-api' );
const collectUtils = require( './collect-utils' );
const gettextParser = require( 'gettext-parser' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();

/**
 * Adds translations to the transifex.
 * Slug must be unique.
 *
 *		Gulp usage:
 		gulp translations:download -u someUsername -p somePassword -n someName
 *
 * @see https://docs.transifex.com/api/translations for API documentation.
 *
 * @param {Object} config
 * @param {String} config.username
 * @param {String} config.password
 * @param {String} config.name
 */
module.exports = function download( config ) {
	const languages = [ 'en' ];

	const packageContexts = collectUtils.getContexts();

	const translationPromises = languages.map( lang => {
		const transifexDownloadConfig = Object.assign( {}, config, { lang } );

		return downloadPoFile( transifexDownloadConfig )
			.then( ( poFileContent ) => ( {
				lang,
				content: gettextParser.po.parse( poFileContent )
			} ) );
	} );

	return Promise.all( translationPromises )
		.then( ( translations ) => {
			createTranslationFiles( translations, packageContexts );
		} );
};

// @param {Object} config
// @param {String} config.username
// @param {String} config.password
// @param {String} config.name
// @param {String} config.lang
// @returns {Promise<String>}
function downloadPoFile( config ) {
	return transifexAPI.getTranslation( config )
	.then( ( data ) => {
		const { content } = JSON.parse( data );
		logger.info( 'SUCCESS' );

		return content;
	} )
	.catch( ( err ) => logger.error( err ) );
}

function createTranslationFiles() {
	//
}