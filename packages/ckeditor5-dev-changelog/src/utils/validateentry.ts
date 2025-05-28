/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ValidatedType, ParsedFile, ValidatedFile } from '../types.js';
import { ISSUE_PATTERN, ISSUE_SLUG_PATTERN, ISSUE_URL_PATTERN, TYPES } from '../constants.js';

export function validateEntry( entry: ParsedFile, packagesNames: Array<string>, singlePackage: boolean ): {
	isValid: boolean;
	validatedEntry: ValidatedFile;
} {
	const noScopePackagesNames = packagesNames.map( packageName => packageName.replace( /@.*\//, '' ) );
	const data = entry.data;
	const validations: Array<string> = [];
	let isValid = true;

	const allowedTypesArray: Array<string> = TYPES.map( ( { name } ) => name );
	const allowedTypesList = getAllowedTypesList();

	if ( typeof data.type === 'undefined' ) {
		validations.push( 'Provide a type with one of the values: "Feature", "Other" or "Fix" (case insensitive).' );

		isValid = false;
	} else if ( !allowedTypesArray.includes( data.type ) ) {
		validations.push( `Type "${ data.type }" should be one of: ${ allowedTypesList } (case insensitive).` );

		isValid = false;
	}

	if ( singlePackage && [ 'Major breaking change', 'Minor breaking change' ].includes( data.type! ) ) {
		validations.push(
			`Breaking change "${ data.type }" should be generic: "breaking", for a single package mode (case insensitive).`
		);

		isValid = false;
	}

	if ( !singlePackage && data.type === 'Breaking change' ) {
		validations.push(
			`Breaking change "${ data.type }" should be one of: "minor", "major", for a monorepo (case insensitive).`
		);

		isValid = false;
	}

	if ( data.scope ) {
		const scopeValidated = [];

		for ( const scopeName of data.scope ) {
			if ( !noScopePackagesNames.includes( scopeName ) ) {
				validations.push( `Scope "${ scopeName }" is not recognized as a valid package in the repository.` );
			} else {
				scopeValidated.push( scopeName );
			}
		}

		data.scope = scopeValidated;
	}

	if ( data.see ) {
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
	}

	if ( data.closes ) {
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
	}

	const validatedEntry = {
		...entry,
		data: {
			...data,
			validations,
			type: data.type as ValidatedType
		}
	};

	return { isValid, validatedEntry };
}

function getAllowedTypesList(): string {
	const formatter = new Intl.ListFormat( 'en-US', { style: 'long', type: 'disjunction' } );

	const items = TYPES.map( type => {
		let entry = `"${ type.name }"`;

		if ( 'aliases' in type ) {
			const list = type.aliases.map( alias => `"${ alias }"` ).join( ', ' );

			entry += ` (${ list } ${ type.aliases.length > 1 ? 'are' : 'is' } also allowed)`;
		}

		return entry;
	} );

	return formatter.format( items );
}
