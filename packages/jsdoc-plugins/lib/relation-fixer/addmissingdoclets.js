/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
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
		// Missing inherited items:
		// - statics methods
		// - methods
		// - properties
		// - events
		{
			relation: 'augmentsNested'
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

	doclets = doclets.filter( doclet => !doclet.ignore );

	const docletToAddMap = new Map(
		newDocletsToAdd
			.filter( d => !d.ignore )
			.map( d => [ d.longname, d ] )
	);

	const existingDoclets = new Map( doclets.map( d => [ d.longname, d ] ) );

	// The code here is hackish...
	// We need to smartly determine which doclet should be get from the native JSDoc inheritance
	// and which should be added from our custom inheritance mechanism.
	return [
		...doclets.filter( doclet => {
			const willDocletBeAdded = docletToAddMap.has( doclet.longname );

			// If the doclet has inherited property don't output it
			// as it should be replaced by the parent's class/interface/mixin method doclet.
			if ( willDocletBeAdded && doclet.inheritdoc === undefined ) {
				return false;
			}

			return true;
		} ),

		// Do not output doclets that have its own documentation.
		...Array.from( docletToAddMap.values() ).filter( doclet => {
			const existingDoclet = existingDoclets.get( doclet.longname );

			if ( !existingDoclet ) {
				return true;
			}

			if ( existingDoclet.inheritdoc === undefined ) {
				return true;
			}

			return false;
		} )
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
