/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const getMissingDocletsData = require( './getmissingdocletsdata' );
const cloneDeep = require( 'lodash' ).cloneDeep;

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
	const entitiesWhichNeedNewDoclets = clonedDoclets.filter( d => {
		return d.kind === 'class' || d.kind === 'interface' || d.kind === 'mixin';
	} );
	const newDocletsToAdd = [];
	const docletsToIgnore = [];
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

	for ( const childDoclet of entitiesWhichNeedNewDoclets ) {
		for ( const setting of settings ) {
			const missingDocletsData = getMissingDocletsData(
				clonedDoclets,
				childDoclet,
				setting
			);

			newDocletsToAdd.push( ...missingDocletsData.newDoclets );
			docletsToIgnore.push( ...missingDocletsData.docletsWhichShouldBeIgnored );
		}
	}

	docletsToIgnore.forEach( d => {
		d.ignore = true;
	} );
	clonedDoclets.push( ...newDocletsToAdd );

	return clonedDoclets;
}
