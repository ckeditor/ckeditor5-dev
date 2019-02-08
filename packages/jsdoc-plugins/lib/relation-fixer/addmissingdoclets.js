/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */
// @ts-check

'use strict';

const getMissingDocletsData = require( './getmissingdocletsdata' );
const cloneDeep = require( 'lodash' ).cloneDeep;
const DocletCollection = require( '../utils/doclet-collection' );

module.exports = addMissingDoclets;

/**
 * Adds missing doclets for members coming from implemented interfaces, extended classes, and mixins.
 * It does also support inheritance of static members which isn't supported by the JSDoc.
 * This module requires the input preprocessed by the `buildRelations()` function.
 *
 * @param {Array.<Doclet>} originalDoclets
 * @returns {Array.<Doclet>}
 */
function addMissingDoclets( originalDoclets ) {
	const clonedDoclets = cloneDeep( originalDoclets );
	const docletCollection = new DocletCollection();
	const typedefDoclets = [];

	for ( const doclet of clonedDoclets ) {
		// Group doclets by memberof property.
		docletCollection.add( `memberof:${ doclet.memberof }`, doclet );

		if ( doclet.kind === 'typedef' ) {
			typedefDoclets.push( doclet );
		}
	}

	const extensibleDoclets = clonedDoclets.filter( doclet => {
		return (
			doclet.kind === 'class' ||
			doclet.kind === 'interface' ||
			doclet.kind === 'mixin'
		);
	} );
	const newDocletsToAdd = [];
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

	for ( const docletToIgnore of docletsToIgnore ) {
		docletToIgnore.ignore = true;
	}

	clonedDoclets.push( ...newDocletsToAdd );

	extendTypedefs( typedefDoclets );

	return clonedDoclets;
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
