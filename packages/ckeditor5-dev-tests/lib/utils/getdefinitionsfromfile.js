/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

/**
 * @param {String|null} definitionSource
 * @returns {Object}
 */
module.exports = function getDefinitionsFromFile( definitionSource ) {
	if ( !definitionSource ) {
		return {};
	}

	try {
		const definitions = require( normalizeDefinitionSource( definitionSource ) );

		const stringifiedDefinitions = {};

		for ( const definitionName in definitions ) {
			stringifiedDefinitions[ definitionName ] = JSON.stringify( definitions[ definitionName ] );
		}

		return stringifiedDefinitions;
	} catch ( err ) {
		console.error( err.message );

		return {};
	}
};

/**
 * @param {String|null} definitionSource
 * @returns {String|null}
 */
function normalizeDefinitionSource( definitionSource ) {
	// Passed an absolute path.
	if ( path.isAbsolute( definitionSource ) ) {
		return definitionSource;
	}

	// Passed a relative path. Merge it with the current working directory.
	return path.join( process.cwd(), definitionSource );
}
