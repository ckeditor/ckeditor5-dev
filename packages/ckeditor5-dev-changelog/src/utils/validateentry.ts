/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../types.js';
import { ISSUE_PATTERN, ISSUE_SLUG_PATTERN } from '../constants.js';

export function validateEntry( entry: ParsedFile, packagesNames: Array<string>, singlePackage: boolean ): {
	isValid: boolean;
	validatedEntry: ParsedFile;
} {
	const noScopePackagesNames = packagesNames.map( packageName => packageName.replace( /@.*\//, '' ) );
	const data = entry.data;
	const validations: Array<string> = [];

	if ( ![ 'Fix', 'Feature', 'Other' ].includes( data.typeNormalized! ) ) {
		validations.push( `Type "${ data.type }" should be one of: "Feature", "Other" or "Fix" ("Fixes" is allowed) (case insensitive).` );
	}

	if ( !singlePackage && ![ 'minor', 'major' ].includes( data.breakingChangeNormalized as string ) ) {
		validations.push(
			`Breaking change "${ data[ 'breaking-change' ] }" should be one of: "minor", "major", for a monorepo (case insensitive).`
		);
	} else if ( singlePackage && !( typeof data[ 'breaking-change' ] === 'undefined' || data.breakingChangeNormalized === true ) ) {
		validations.push( [
			`Breaking change "${ data[ 'breaking-change' ] }" should be one of:`,
			'"true", or not specified, for a single repo (case insensitive).'
		].join( ' ' ) );
	}

	if ( data.scopeNormalized ) {
		for ( const scopeName of data.scopeNormalized ) {
			if ( !noScopePackagesNames.includes( scopeName ) ) {
				validations.push( `Scope "${ scopeName }" is not recognised as a valid package in the repository.` );
			}
		}
	}

	if ( data.seeNormalized ) {
		for ( const see of data.seeNormalized ) {
			if ( !( String( see ).match( ISSUE_PATTERN ) || String( see ).match( ISSUE_SLUG_PATTERN ) ) ) {
				validations.push( `See "${ see }" is not a valid issue reference. Provide either: a number, slug#id.` );
			}
		}
	}

	if ( data.closesNormalized ) {
		for ( const closes of data.closesNormalized ) {
			if ( !( String( closes ).match( ISSUE_PATTERN ) || String( closes ).match( ISSUE_SLUG_PATTERN ) ) ) {
				validations.push( `Closes "${ closes }" is not a valid issue reference. Provide either: a number, slug#id.` );
			}
		}
	}

	const validatedEntry = { ...entry, data: { ...data, invalidDetails: validations } };

	return { isValid: validations.length === 0, validatedEntry };
}
