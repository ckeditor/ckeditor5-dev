/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { TYPES } from '../constants.js';
import type { ParsedFile } from '../types.js';

export function normalizeEntry( entry: ParsedFile ): ParsedFile {
	// Normalize Type.
	const typeCapitalized = capitalize( entry.data.type );
	const matchingType = TYPES.find( type => {
		if ( type.name === typeCapitalized ) {
			return true;
		}

		if ( !( 'aliases' in type ) ) {
			return false;
		}

		return ( type.aliases as ReadonlyArray<string> ).includes( typeCapitalized );
	} );
	const typeNormalized = matchingType ? matchingType.name : undefined;

	// Normalize scope.
	const scope = entry.data.scope;
	const scopeNormalized = scope?.map( scopeEntry => String( scopeEntry ).toLowerCase() );

	// Normalize closes.
	const closesNormalized = entry.data.closes;

	// Normalize see.
	const seeNormalized = entry.data.see;

	return {
		...entry,
		data: {
			...entry.data,
			typeNormalized,
			scopeNormalized,
			closesNormalized,
			seeNormalized
		}
	};
}

function capitalize( value: unknown ) {
	const valueStr = String( value );

	return valueStr.charAt( 0 ).toUpperCase() + valueStr.slice( 1 ).toLowerCase();
}
