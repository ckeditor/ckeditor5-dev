/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const getMissingDocletsData = require( './getmissingdocletsdata' );
const DocletCollection = require( '../utils/doclet-collection' );

module.exports = addMissingDoclets;

/**
 * Adds missing doclets for members coming from implemented interfaces, extended classes, mixins and typedefs.
 * It does also support inheriting static members and typedef inheritance, which both are not supported by the JSDoc.
 * This function requires input to be preprocessed by the `buildRelations()` function.
 *
 * @param {Array.<Doclet>} doclets
 * @returns {Array.<Doclet>}
 */
function addMissingDoclets( doclets ) {
	const docletCollection = new DocletCollection();

	for ( const doclet of doclets ) {
		// Group doclets by memberof property.
		docletCollection.add( `memberof:${ doclet.memberof }`, doclet );
	}

	const extensibleDoclets = doclets.filter( doclet => {
		return (
			doclet.kind === 'class' ||
			doclet.kind === 'interface' ||
			doclet.kind === 'mixin'
		);
	} );

	/** @type {Array.<Doclet>} */
	const newDocletsToAdd = [];

	/** @type {Array.<Doclet>} */
	const docletsToIgnore = [];

	/**
	 * @type {Array.<Object>}
	 **/
	const options = [
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

	const docletMap = createDocletMap( docletCollection );

	for ( const extensibleDoclet of extensibleDoclets ) {
		for ( const option of options ) {
			const missingDocletsData = getMissingDocletsData(
				docletMap,
				docletCollection,
				extensibleDoclet,
				option
			);

			newDocletsToAdd.push( ...missingDocletsData.newDoclets );
			docletsToIgnore.push( ...missingDocletsData.docletsWhichShouldBeIgnored );
		}
	}

	// Ignore doclets that shouldn't be used anymore. They will be removed afterward.
	for ( const docletToIgnore of docletsToIgnore ) {
		docletToIgnore.ignore = true;
	}

	const existingDocletNames = new Set( doclets.map( d => d.longname ) );

	return [
		...doclets,
		// Do not output doclets for doclets having its own documentation.
		...newDocletsToAdd.filter( doclet => !existingDocletNames.has( doclet.longname ) )
	];
}

/**
 * Creates a <longname, doclet> map.
 *
 * @param {DocletCollection} doclets
 * @returns {Object}
 */
function createDocletMap( doclets ) {
	const docletMap = {};

	for ( const doclet of doclets.getAll() ) {
		if ( !docletMap[ doclet.longname ] ) {
			docletMap[ doclet.longname ] = doclet;
		}
	}

	return docletMap;
}
