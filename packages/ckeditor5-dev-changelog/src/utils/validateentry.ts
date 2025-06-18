/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../types.js';
import { ISSUE_PATTERN, ISSUE_SLUG_PATTERN, ISSUE_URL_PATTERN, NICK_NAME_PATTERN, TYPES } from './constants.js';

/**
 * Validates a changelog entry against expected types, scopes, and issue references.
 *
 * It checks if the type is valid and consistent with single or multi-package modes,
 * verifies scopes against known package names, and ensures issue references are correctly formatted.
 *
 * Returns whether the entry is valid along with a validated version including any validation messages.
 */
export function validateEntry( entry: ParsedFile, packagesNames: Array<string>, singlePackage: boolean ): {
	isValid: boolean;
	validatedEntry: ParsedFile;
} {
	const noScopePackagesNames = packagesNames.map( packageName => packageName.replace( /@.*\//, '' ) );
	const data = entry.data;
	const validations: Array<string> = [];
	let isValid = true;

	const allowedTypesArray: Array<string> = TYPES.map( ( { name } ) => name );
	const allowedTypesList = getAllowedTypesList();

	if ( typeof data.type === 'undefined' ) {
		validations.push( `Provide a type with one of the values: ${ allowedTypesList } (case insensitive).` );

		isValid = false;
	} else if ( !allowedTypesArray.includes( data.type ) ) {
		validations.push( `Type is required and should be one of: ${ allowedTypesList } (case insensitive).` );

		isValid = false;
	}

	if ( singlePackage && [ 'Major breaking change', 'Minor breaking change' ].includes( data.type! ) ) {
		validations.push(
			`Breaking change "${ data.type }" should be generic: "Breaking change", for a single package mode (case insensitive).`
		);

		isValid = false;
	}

	if ( !singlePackage && data.type === 'Breaking change' ) {
		validations.push(
			`Breaking change "${ data.type }" should be one of: "Minor breaking change", "Major breaking change" ` +
			'for a monorepo (case insensitive).'
		);

		isValid = false;
	}

	const scopeValidated = [];

	if ( singlePackage ) {
		// Skip scope validation for single package mode
		scopeValidated.push( ...data.scope );
	} else {
		for ( const scopeName of data.scope ) {
			if ( !noScopePackagesNames.includes( scopeName ) ) {
				validations.push( `Scope "${ scopeName }" is not recognized as a valid package in the repository.` );
			} else {
				scopeValidated.push( scopeName );
			}
		}
	}

	data.scope = scopeValidated;

	const seeValidated = [];

	for ( const see of data.see ) {
		if ( !( see.match( ISSUE_PATTERN ) || see.match( ISSUE_SLUG_PATTERN ) || see.match( ISSUE_URL_PATTERN ) ) ) {
			validations.push( [
				`See "${ see }" is not a valid issue reference. Provide either:`,
				'issue number, repository-slug#id or full issue link URL.'
			].join( ' ' ) );
		} else {
			seeValidated.push( see );
		}
	}

	data.see = seeValidated;

	const closesValidated = [];

	for ( const closes of data.closes ) {
		if ( !( closes.match( ISSUE_PATTERN ) || closes.match( ISSUE_SLUG_PATTERN ) || closes.match( ISSUE_URL_PATTERN ) ) ) {
			validations.push( [
				`Closes "${ closes }" is not a valid issue reference. Provide either:`,
				'issue number, repository-slug#id or full issue link URL.'
			].join( ' ' ) );
		} else {
			closesValidated.push( closes );
		}
	}

	data.closes = closesValidated;

	const communityCreditsValidated = [];

	for ( const nickName of data.communityCredits ) {
		if ( !nickName.match( NICK_NAME_PATTERN ) ) {
			validations.push( `Community username "${ nickName }" is not valid GitHub username.` );
		} else {
			communityCreditsValidated.push( nickName );
		}
	}

	data.communityCredits = communityCreditsValidated;

	const validatedEntry = {
		...entry,
		data: {
			...data,
			validations,
			type: data.type
		}
	};

	return { isValid, validatedEntry };
}

function getAllowedTypesList(): string {
	const formatter = new Intl.ListFormat( 'en-US', { style: 'long', type: 'disjunction' } );
	const items = TYPES.map( type => `"${ type.name }"` );

	return formatter.format( items );
}
