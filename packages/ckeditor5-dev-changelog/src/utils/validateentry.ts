/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../types.js';
import { ISSUE_PATTERN, ISSUE_SLUG_PATTERN, ISSUE_URL_PATTERN } from '../constants.js';

export function validateEntry( entry: ParsedFile, packagesNames: Array<string>, singlePackage: boolean ): {
	isValid: boolean;
	validatedEntry: ParsedFile;
} {
	const noScopePackagesNames = packagesNames.map( packageName => packageName.replace( /@.*\//, '' ) );
	const data = entry.data;
	const validations: Array<string> = [];
	let isValid = true;

	if ( typeof data.type === 'undefined' ) {
		validations.push( 'Provide a type with one of the values: "Feature", "Other" or "Fix" ("Fixes" is allowed) (case insensitive).' );

		isValid = false;
	} else if ( ![ 'Fix', 'Feature', 'Other' ].includes( data.typeNormalized! ) ) {
		validations.push( `Type "${ data.type }" should be one of: "Feature", "Other" or "Fix" ("Fixes" is allowed) (case insensitive).` );

		isValid = false;
	}

	const breakingChangeProvided = typeof data[ 'breaking-change' ] !== 'undefined';

	if ( singlePackage ) {
		if ( breakingChangeProvided && ![ 'minor', 'major', true ].includes( data.breakingChangeNormalized as string ) ) {
			validations.push( [
				`Breaking change "${ data[ 'breaking-change' ] }" should be one of:`,
				'"true", or not specified, for a single repo (case insensitive).'
			].join( ' ' ) );

			isValid = false;
		}
	} else {
		if ( breakingChangeProvided && ![ 'minor', 'major' ].includes( data.breakingChangeNormalized as string ) ) {
			validations.push(
				`Breaking change "${ data[ 'breaking-change' ] }" should be one of: "minor", "major", for a monorepo (case insensitive).`
			);

			isValid = false;
		}
	}

	if ( data.scopeNormalized ) {
		const scopeValidated = [];

		for ( const scopeName of data.scopeNormalized ) {
			if ( !noScopePackagesNames.includes( scopeName ) ) {
				validations.push( `Scope "${ scopeName }" is not recognised as a valid package in the repository.` );
			} else {
				scopeValidated.push( scopeName );
			}
		}

		data.scopeValidated = scopeValidated;
	}

	if ( data.seeNormalized ) {
		const seeValidated = [];

		for ( const see of data.seeNormalized ) {
			if ( !( see.match( ISSUE_PATTERN ) || see.match( ISSUE_SLUG_PATTERN ) || see.match( ISSUE_URL_PATTERN ) ) ) {
				validations.push( [
					`See "${ see }" is not a valid issue reference. Provide either:`,
					'issue number, repository-slug#id or full issue link URL.'
				].join( ' ' ) );
			} else {
				seeValidated.push( see );
			}
		}

		data.seeValidated = seeValidated;
	}

	if ( data.closesNormalized ) {
		const closesValidated = [];

		for ( const closes of data.closesNormalized ) {
			if ( !( closes.match( ISSUE_PATTERN ) || closes.match( ISSUE_SLUG_PATTERN ) || closes.match( ISSUE_URL_PATTERN ) ) ) {
				validations.push( [
					`Closes "${ closes }" is not a valid issue reference. Provide either:`,
					'issue number, repository-slug#id or full issue link URL.'
				].join( ' ' ) );
			} else {
				closesValidated.push( closes );
			}
		}

		data.closesValidated = closesValidated;
	}

	const validatedEntry = { ...entry, data: { ...data, validations } };

	return { isValid, validatedEntry };
}
