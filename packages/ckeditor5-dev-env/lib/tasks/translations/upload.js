/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const transifexAPI = require( './transifex-api' );
const path = require( 'path' );

/**
 * Adds translations to the transifex.
 * Slug must be unique.
 *
 *		Gulp usage
 		gulp translations:upload --username someUsername --password somePassword --slug someSlug
 *
 * @see https://docs.transifex.com/api/resources for API documentation.
 *
 * @param {Object} config
 * @param {String} config.username - username to the transifex account.
 * @param {String} config.password - password to the transifex account.
 * @param {String} config.slug - unique id used for later updates. Max 50 chars.
 * @param {String} config.name - name of the translation update.
 * @param {String} firstTime
 */
module.exports = function upload( config ) {
	const pathToPoFile = path.join( process.cwd(), 'build', '.transifex/en.pot' );

	const updateResource = config.firstTime ?
		transifexAPI.postResource :
		transifexAPI.putResourceContent;

	return updateResource( Object.assign( {}, config, {
		content: fs.createReadStream( pathToPoFile )
	} ) )
	.then( ( dataOrMessage ) => tryParseContent( dataOrMessage ) )
	.catch( ( err ) => console.error( err ) );
};

function tryParseContent( dataOrMessage ) {
	try {
		const [ newOnes, updated, deleted ] = JSON.parse( dataOrMessage );
		console.log( `NEW: ${ newOnes }` );
		console.log( `UPDATED: ${ updated }` );
		console.log( `DELETED: ${ deleted }` );
	} catch ( err ) {
		throw new Error( dataOrMessage );
	}
}