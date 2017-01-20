/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const transifexAPI = require( './transifex-api' );
const collectUtils = require( './collect-utils' );
const gettextParser = require( 'gettext-parser' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const fs = require( 'fs' );

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

	const packagePoFilePromises = packageContexts.map( ( [ packageName ] ) => {
		return downloadPoFilesForPackage( config, languages, packageName )
			.then( ( translations ) => {
				return createTranslationFiles( translations, packageContexts );
			} );
	} );

	return Promise.all( packagePoFilePromises )
		.then( () => logger.info( '\nSUCCESS\n' ) )
		.catch( ( err ) => logger.error( err ) );
};

function downloadPoFilesForPackage( config, languages, packageName ) {
	const poFileForPackagePromise = languages.map( lang => {
		const transifexDownloadConfig = Object.assign( {}, config, {
			lang,
			slug: packageName
		} );

		const parsedPoFilePromise = downloadAndParsePoFile( transifexDownloadConfig );

		return parsedPoFilePromise.then( ( parsedPoFiles ) => {
			// TODO
			fs.writeFileSync( parsedPoFiles );
		} );
	} );

	return Promise.all( poFileForPackagePromise );
}

function downloadAndParsePoFile( transifexDownloadConfig ) {
	return downloadPoFile( transifexDownloadConfig )
		.then( ( poFileContent ) => gettextParser.po.parse( poFileContent ) )
		.catch( ( err ) => logger.error( err ) );
}

// @param {Object} config
// @param {String} config.username
// @param {String} config.password
// @param {String} config.packageName
// @param {String} config.lang
// @returns {Promise<String>}
function downloadPoFile( config ) {
	return transifexAPI.getTranslation( config ).then( ( data ) => {
		const { content } = JSON.parse( data );
		logger.info( 'SUCCESS' );

		return content;
	} );
}

function createTranslationFiles() {
	//
}

