/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../types.js';

export function normalizeEntry( entry: ParsedFile ): ParsedFile {
	// Normalize type.
	const typeCapitalized = capitalize( entry.data.type );
	const typeNormalized = typeCapitalized === 'Fixes' ? 'Fix' : typeCapitalized;

	// Normalize breaking-change.
	const breakingChange = entry.data[ 'breaking-change' ];
	const breakingChangeLowerCase = String( breakingChange ).toLowerCase();
	let breakingChangeNormalized: string | boolean | undefined;

	if ( typeof breakingChange === 'boolean' ) {
		breakingChangeNormalized = breakingChange;
	} else {
		breakingChangeNormalized = breakingChangeLowerCase;
	}

	// Normalize scope.
	const scope = entry.data.scope;
	const scopeNormalized = scope?.map( scopeEntry => String( scopeEntry ).toLowerCase() );

	// Normalize closes.
	const closesNormalized = entry.data.closes?.map( closes => String( closes ) );

	// Normalize see.
	const seeNormalized = entry.data.see?.map( see => String( see ) );

	return {
		...entry,
		data: {
			...entry.data,
			typeNormalized,
			breakingChangeNormalized,
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
