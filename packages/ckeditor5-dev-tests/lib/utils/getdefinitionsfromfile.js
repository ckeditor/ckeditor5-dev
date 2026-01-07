/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire( import.meta.url );

/**
 * @param {string|null} definitionSource
 * @returns {object}
 */
export default function getDefinitionsFromFile( definitionSource ) {
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
}

/**
 * @param {string|null} definitionSource
 * @returns {string|null}
 */
function normalizeDefinitionSource( definitionSource ) {
	// Passed an absolute path.
	if ( path.isAbsolute( definitionSource ) ) {
		return definitionSource;
	}

	// Passed a relative path. Merge it with the current working directory.
	return path.join( process.cwd(), definitionSource );
}
