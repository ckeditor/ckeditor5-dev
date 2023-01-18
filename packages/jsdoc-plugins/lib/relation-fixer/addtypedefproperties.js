/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { cloneDeep } = require( 'lodash' );

module.exports = addTypedefProperties;

/**
 * It adds missing properties to doclet when in extends another doclets (with the `@extends` tag).
 * Without modification on the original doclets it returns extended original doclets
 * and new member doclets for each typedef property.
 *
 * @param {Array.<Doclet>} doclets
 * @returns {Array.<Doclet>}
 */
function addTypedefProperties( doclets ) {
	const typedefDoclets = doclets.filter( doclet => doclet.kind === 'typedef' );

	// 1. Extend typedefs with missing properties.
	doclets = doclets.map( doclet => {
		if ( doclet.kind == 'typedef' ) {
			return extendTypedef( doclet, typedefDoclets );
		}

		return doclet;
	} );

	// 2. Add doclets for typedef properties.
	const typedefPropertyDoclets = createTypedefPropertyDoclets( typedefDoclets );

	return [
		...doclets,
		...typedefPropertyDoclets
	];
}

/**
 * Copy properties from parent typedefs to typedefs which extend them.
 *
 * @param {Doclet} typedef
 * @param {Array.<Doclet>} typedefDoclets
 */
function extendTypedef( typedef, typedefDoclets ) {
	if ( !typedef.properties || !typedef.augmentsNested || !typedef.augmentsNested.length ) {
		return typedef;
	}

	// Prevent possible mutations.
	typedef = cloneDeep( typedef );

	for ( const parentLongname of typedef.augmentsNested ) {
		const parentDoclet = typedefDoclets.find( doclet => doclet.longname === parentLongname );

		if ( !parentDoclet ) {
			console.error( `Base typedef (${ parentLongname }) for the ${ typedef.longname } typedef is missing.` );
		}

		if ( !parentDoclet.properties ) {
			continue;
		}

		for ( const parentProperty of parentDoclet.properties ) {
			if ( !typedef.properties.find( p => p.name === parentProperty.name ) ) {
				const inheritedProperty = cloneDeep( parentProperty );
				inheritedProperty.inherited = true;
				typedef.properties.push( inheritedProperty );
			}
		}
	}

	return typedef;
}

/**
 * Creates and returns doclets for `@typedef` properties.
 *
 * @param {Array.<Doclet>} typedefDoclets
 */
function createTypedefPropertyDoclets( typedefDoclets ) {
	const typedefPropertyDoclets = [];

	for ( const typedefDoclet of typedefDoclets ) {
		for ( const property of typedefDoclet.properties || [] ) {
			/** @type Doclet */
			const propertyDoclet = {
				comment: property.description || '',
				description: property.description,

				// Use the typedef's metadata.
				meta: cloneDeep( typedefDoclet.meta ),
				kind: 'member',
				name: property.name,
				type: property.type,
				longname: typedefDoclet.longname + '#' + property.name,
				scope: 'instance',
				memberof: typedefDoclet.longname
			};

			typedefPropertyDoclets.push( propertyDoclet );
		}
	}

	return typedefPropertyDoclets;
}
