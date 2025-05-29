/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { TYPES } from '../constants.js';
import type { ParsedFile, ValidatedType } from '../types.js';

const typesToCast: Array<ValidatedType> = [
	'Major breaking change',
	'Minor breaking change'
];

export function normalizeEntry( entry: ParsedFile, singlePackage: boolean ): ParsedFile {
	// Normalize type.
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
	let typeNormalized = matchingType ? matchingType.name : undefined;

	if ( singlePackage && typesToCast.includes( typeNormalized! ) ) {
		typeNormalized = 'Breaking change';
	}

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

function capitalize( value: unknown ) {
	const valueStr = String( value );

	return valueStr.charAt( 0 ).toUpperCase() + valueStr.slice( 1 ).toLowerCase();
}

function ensureAt( str: string ) {
	return str.startsWith( '@' ) ? str : '@' + str;
}
