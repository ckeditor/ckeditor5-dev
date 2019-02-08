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
 * Adds missing doclets of members coming from implemented interfaces and extended classes.
 * JSDoc does not support inheritance of static members which is why the plugin was made.
 * This module requires the input to be processed by 'buildrelations' module first.
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

	const entitiesWhichNeedNewDoclets = clonedDoclets.filter( d => {
		return d.kind === 'class' || d.kind === 'interface' || d.kind === 'mixin';
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

	console.log( clonedDoclets.filter( d => d.longname === 'module:engine/controller/datacontroller~DataController#set' ) );

	for ( const interfaceClassOrMixinDoclet of entitiesWhichNeedNewDoclets ) {
		for ( const setting of settings ) {
			const missingDocletsData = getMissingDocletsData(
				docletCollection,
				interfaceClassOrMixinDoclet,
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

	return clonedDoclets
		.filter( d => !d.ignore );
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
