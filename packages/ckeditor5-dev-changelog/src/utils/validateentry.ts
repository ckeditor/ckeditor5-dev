/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../types.js';
import { ISSUE_PATTERN, ISSUE_SLUG_PATTERN, ISSUE_URL_PATTERN, TYPES } from '../constants.js';

export function validateEntry( entry: ParsedFile, packagesNames: Array<string>, singlePackage: boolean ): {
	isValid: boolean;
	validatedEntry: ParsedFile;
} {
	const noScopePackagesNames = packagesNames.map( packageName => packageName.replace( /@.*\//, '' ) );
	const data = entry.data;
	const validations: Array<string> = [];

	const allowedTypesArray = TYPES.map( ( { name } ) => name );
	const allowedTypesList = new Intl.ListFormat(
		'en-US', { style: 'long', type: 'disjunction' }
	).format(
		TYPES.map( type => {
			let entry = `"${ type.name }"`;

			if ( 'aliases' in type ) {
				const list = type.aliases.map( alias => `"${ alias }"` ).join( ', ' );

				entry += ` (${ list } ${ type.aliases.length > 1 ? 'are' : 'is' } also allowed)`;
			}

			return entry;
		} )
	);

	if ( typeof data.type === 'undefined' ) {
		validations.push( `Provide a type with one of the values: ${ allowedTypesList } (case insensitive).` );
	} else if ( !allowedTypesArray.includes( data.typeNormalized! ) ) {
		validations.push( `Type "${ data.type }" should be one of: ${ allowedTypesList } (case insensitive).` );
	}

	if ( singlePackage ) {
		if ( data.typeNormalized === 'Major' || data.typeNormalized === 'Minor' ) {
			validations.push(
				`Breaking change "${ data.type }" should be generic: "breaking", for a single package mode (case insensitive).`
			);
		}
	} else {
		if ( !singlePackage && data.typeNormalized === 'Breaking' ) {
			validations.push(
				`Breaking change "${ data.type }" should be one of: "minor", "major", for a monorepo (case insensitive).`
			);
		}
	}

	if ( data.scopeNormalized ) {
		for ( const scopeName of data.scopeNormalized ) {
			if ( !noScopePackagesNames.includes( scopeName ) ) {
				validations.push( `Scope "${ scopeName }" is not recognized as a valid package in the repository.` );
			}
		}
	}

	if ( data.seeNormalized ) {
		for ( const see of data.seeNormalized ) {
			const seeStr = String( see );

			if ( !( seeStr.match( ISSUE_PATTERN ) || seeStr.match( ISSUE_SLUG_PATTERN ) || seeStr.match( ISSUE_URL_PATTERN ) ) ) {
				validations.push( [
					`See "${ see }" is not a valid issue reference. Provide either:`,
					'issue number, repository-slug#id or full issue link URL.'
				].join( ' ' ) );
			}
		}
	}

	if ( data.closesNormalized ) {
		for ( const closes of data.closesNormalized ) {
			const closesStr = String( closes );

			if ( !( closesStr.match( ISSUE_PATTERN ) || closesStr.match( ISSUE_SLUG_PATTERN ) || closesStr.match( ISSUE_URL_PATTERN ) ) ) {
				validations.push( [
					`Closes "${ closes }" is not a valid issue reference. Provide either:`,
					'issue number, repository-slug#id or full issue link URL.'
				].join( ' ' ) );
			}
		}
	}

	const validatedEntry = { ...entry, data: { ...data, validations } };

	return { isValid: validations.length === 0, validatedEntry };
}
