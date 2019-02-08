/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */
// @ts-check

'use strict';

const { cloneDeep } = require( 'lodash' );
const getMissingDocletsData = require( './getmissingdocletsdata' );
const DocletCollection = require( '../utils/doclet-collection' );

module.exports = addMissingDoclets;

/**
 * Adds missing doclets for members coming from implemented interfaces, extended classes, and mixins.
 * It does also support inheriting static members and typedef inheritance, which both are not supported by the JSDoc.
 * This module requires the input preprocessed by the `buildRelations()` function.
 *
 * @param {Array.<Doclet>} doclets
 * @returns {Array.<Doclet>}
 */
function addMissingDoclets( doclets ) {
	doclets = cloneDeep( doclets );

	const docletCollection = new DocletCollection();

	/** @type {Doclet[]} */
	const typedefDoclets = [];

	for ( const doclet of doclets ) {
		// Group doclets by memberof property.
		docletCollection.add( `memberof:${ doclet.memberof }`, doclet );

		if ( doclet.kind === 'typedef' ) {
			typedefDoclets.push( doclet );
		}
	}

	extendTypedefs( typedefDoclets );

	const extensibleDoclets = doclets.filter( doclet => {
		return (
			doclet.kind === 'class' ||
			doclet.kind === 'interface' ||
			doclet.kind === 'mixin'
		);
	} );

	/** @type {Doclet[]} */
	const newDocletsToAdd = [];

	/** @type {Doclet[]} */
	const docletsToIgnore = [];

	/**
	 * @type {Array<{relation: 'augmentsNested'|'mixesNested'|'implementsNested';filter?:Object;onlyImplicitlyInherited?:Boolean}>}
	 **/
	const settings = [
		// Missing statics inherited from parent classes.
		{
			relation: 'augmentsNested',
			filter: {
				scope: 'static'
			}
		},

		// Missing events inherited from parent classes.
		{
			relation: 'augmentsNested',
			filter: {
				kind: 'event'
			}
		},

		// Everything mixed, except existing mixed items.
		{
			relation: 'mixesNested',
			onlyImplicitlyInherited: true
		},

		// Everything from implemented interfaces.
		{
			relation: 'implementsNested'
		}
	];

	for ( const extensibleDoclet of extensibleDoclets ) {
		for ( const setting of settings ) {
			const missingDocletsData = getMissingDocletsData(
				docletCollection,
				extensibleDoclet,
				setting
			);

			newDocletsToAdd.push( ...missingDocletsData.newDoclets );
			docletsToIgnore.push( ...missingDocletsData.docletsWhichShouldBeIgnored );
		}
	}

	// Ignore doclets that shouldn't be used anymore. They will be removed afterward.
	for ( const docletToIgnore of docletsToIgnore ) {
		docletToIgnore.ignore = true;
	}

	return [
		...doclets,
		...newDocletsToAdd
	];
}

/**
 * Copy properties from parent typedefs to typedefs which extend them.
 *
 * @param {Doclet[]} typedefDoclets
 */
function extendTypedefs( typedefDoclets ) {
	for ( const typedefDoclet of typedefDoclets ) {
		for ( const parentLongname of typedefDoclet.augmentsNested ) {
			const parentDoclet = typedefDoclets.find( doclet => doclet.longname === parentLongname );

			if ( parentDoclet && parentDoclet.properties ) {
				parentDoclet.properties.forEach( parentProperty => {
					if ( typedefDoclet.properties && !typedefDoclet.properties.find( p => p.name === parentProperty.name ) ) {
						const inheritedProperty = cloneDeep( parentProperty );
						inheritedProperty.inherited = true;
						typedefDoclet.properties.push( inheritedProperty );
					}
				} );
			}
		}
	}
}
