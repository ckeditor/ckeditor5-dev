/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { FileMetadata, ParsedFile } from '../types.js';

export function normalizeEntry( entry: ParsedFile<Partial<FileMetadata>>, isSinglePackage: boolean ): ParsedFile {
	// Normalize type.
	const typeNormalized = getTypeNormalized( entry.data.type, isSinglePackage );

	// Normalize scope.
	const scopeNormalized = toArray( entry.data.scope )
		.filter( scope => scope )
		.map( scopeEntry => String( scopeEntry ).toLowerCase() )
		.sort();

	// Normalize closes.
	const closesNormalized = toArray( entry.data.closes )
		.filter( closes => closes )
		.map( closes => String( closes ) );

	// Normalize see.
	const seeNormalized = toArray( entry.data.see )
		.filter( see => see ).map( see => String( see ) );

	// Normalize community credits.
	const communityCreditsNormalized = toArray( entry.data.communityCredits )
		.filter( see => see )
		.map( credits => ensureAt( String( credits ) ) );

	return {
		...entry,
		data: {
			type: typeNormalized,
			scope: deduplicate( scopeNormalized ),
			closes: deduplicate( closesNormalized ),
			see: deduplicate( seeNormalized ),
			communityCredits: deduplicate( communityCreditsNormalized ),
			validations: []
		}
	};
}

function getTypeNormalized( type: string | undefined, isSinglePackage: boolean ): string {
	const typeCapitalized = capitalize( type );
	const expectedBreakingChangeTypes = [ 'Major breaking change', 'Minor breaking change' ];

	if ( isSinglePackage && expectedBreakingChangeTypes.includes( typeCapitalized ) ) {
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

function deduplicate( packageNames: Array<string> | undefined ): Array<string> {
	return [ ...new Set( packageNames ) ];
}

function toArray( input: unknown ): Array<unknown> {
	if ( !input ) {
		return [];
	}

	return Array.isArray( input ) ? input : [ input ];
}
