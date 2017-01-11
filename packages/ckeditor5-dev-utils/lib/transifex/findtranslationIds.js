/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const glob = require( 'glob' );
const fs = require( 'fs' );

module.exports = function findTranslationIds( path ) {
	const files = glob.sync( path  );
	console.log( files.length );

	const translationsIds  = collectTranslationIds( files );

	// TODO - deduplication, warnings.
	return translationsIds;
};

function collectTranslationIds( files ) {
	const ids = [];

	for ( const file of files ) {
		const content =  fs.readFileSync( file, 'utf-8' );

		const fullMatches = content.match( /[\s]t\([^)]+?\)/g ) || [];

		for ( const fullMatch of fullMatches ) {
			const stringMatch = fullMatch.match( /'([^']+?)'/ );

			if ( !stringMatch ) {
				console.error( `Incorrect translation call: ${ fullMatch } in ${ file }` );
				continue;
			}

			ids.push( stringMatch[1] );
		}
	}

	return ids;
}