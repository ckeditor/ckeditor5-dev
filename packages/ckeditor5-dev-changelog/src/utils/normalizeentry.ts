/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile, ValidatedType } from '../types.js';

export function normalizeEntry( entry: ParsedFile, isSinglePackage: boolean ): ParsedFile {
	// Normalize type.
	const typeNormalized = getTypeNormalized( entry.data.type, isSinglePackage );

	// Normalize scope.
	const scope = entry.data.scope;
	const scopeLowercase = scope?.filter( scope => scope ).map( scopeEntry => String( scopeEntry ).toLowerCase() );
	const scopeNormalized = [ ...new Set( scopeLowercase ) ].sort();

	// Normalize closes.
	const closesNormalized = entry.data.closes?.filter( closes => closes ).map( closes => String( closes ) );

	// Normalize see.
	const seeNormalized = entry.data.see?.filter( see => see ).map( see => String( see ) );

	// Normalize community credits.
	const communityCreditsNormalized = entry.data.communityCredits
		?.filter( see => see )
		.map( credits => ensureAt( String( credits ) ) );

	return {
		...entry,
		data: {
			...entry.data,
			type: typeNormalized,
			scope: scopeNormalized,
			closes: closesNormalized,
			see: seeNormalized,
			communityCredits: communityCreditsNormalized
		}
	};
}

function getTypeNormalized( type: string | undefined, isSinglePackage: boolean ) {
	const typeCapitalized = capitalize( type );
	const expectedBreakingChangeTypes: Array<ValidatedType> = [ 'Major breaking change', 'Minor breaking change' ];

	if ( isSinglePackage && expectedBreakingChangeTypes.includes( typeCapitalized as ValidatedType ) ) {
		return 'Breaking change';
	}

	return typeCapitalized;
}

function capitalize( value: unknown ) {
	const valueStr = String( value );

	return valueStr.charAt( 0 ).toUpperCase() + valueStr.slice( 1 ).toLowerCase();
}

function ensureAt( str: string ) {
	return str.startsWith( '@' ) ? str : '@' + str;
}
