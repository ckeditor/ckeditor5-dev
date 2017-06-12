/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const cloneDeep = require( 'lodash' ).cloneDeep;

module.exports = getMissingDocletsData;

/**
 * Gets missing doclets of members coming from implemented interfaces and extended classes.
 * Returns also doclets which should be ignored as no longer necessary.
 * This module requires the input to be processed by 'relationbuilder' first.
 *
 * @param {Array.<Doclet>} originalDoclets
 * @param {Doclet} childDoclet Doclet representing an entity which has some inherited members missing.
 * @param {Object} options
 * @param {String} options.relation Name of relation between child entity and its ancestors (e.g. `augmentsNested`).
 * @param {Object} options.filter Object used to filter missing doclets (e.g. { scope: 'static' }).
 * @returns {Object.newDoclets}
 * @returns {Object.docletsWhichShouldBeIgnored}
 */
function getMissingDocletsData( originalDoclets, childDoclet, options ) {
	const newDoclets = [];
	const docletsWhichShouldBeIgnored = [];
	const docletsToAdd = getDocletsToAdd( originalDoclets, childDoclet, options );

	for ( const d of docletsToAdd ) {
		const clonedDoclet = cloneDeep( d );

		clonedDoclet.longname = getLongnameForNewDoclet( d, childDoclet );
		clonedDoclet.memberof = childDoclet.longname;

		// Add property `inherited`
		if ( checkIfAddInheritedProperty( originalDoclets, childDoclet, d, options.relation ) ) {
			clonedDoclet.inherited = true;
		}

		const docletsWithSameLongname = originalDoclets.filter( d => d.longname === clonedDoclet.longname );

		if ( docletsWithSameLongname.length === 0 ) {
			// If there was no doclet for that member, simply add it to new doclets.
			newDoclets.push( clonedDoclet );
		} else if ( checkIfExplicitlyInherits( docletsWithSameLongname ) ) {
			// If doclet for that member already existed and used `inheritdoc` or`overrides`.
			// Add `ignore` property to existing doclets.
			docletsWhichShouldBeIgnored.push( ...docletsWithSameLongname );
			newDoclets.push( clonedDoclet );
		}
	}

	return {
		newDoclets,
		docletsWhichShouldBeIgnored
	};
}

// Gets doclets from entities related to current doclet ( e.g. implemented by it )
// and matching criteria given in options.filter.
function getDocletsToAdd( allDoclets, childDoclet, options ) {
	if ( !isNonEmptyArray( childDoclet[ options.relation ] ) ) {
		return [];
	}

	// longnames of doclets which are related ( extended, mixed, implemented ) to childDoclet
	const ancestors = childDoclet[ options.relation ];

	return ancestors.reduce( ( docletsToAdd, longname ) => {
		const toAdd = allDoclets.filter( d => {
			let isMatchingFilterOptions = true;

			for ( const key of Object.keys( options.filter ) ) {
				if ( d[ key ] !== options.filter[ key ] ) {
					isMatchingFilterOptions = false;
				}
			}

			return d.memberof === longname && isMatchingFilterOptions;
		} );

		docletsToAdd.push( ...toAdd );

		return docletsToAdd;
	}, [] );
}

function isNonEmptyArray( obj ) {
	return Array.isArray( obj ) && obj.length > 0;
}

function getLongnameForNewDoclet( parentDoclet, childDoclet ) {
	const dotIndex = parentDoclet.longname.lastIndexOf( '.' );
	const hashIndex = parentDoclet.longname.lastIndexOf( '#' );
	const name = parentDoclet.longname.slice( Math.max( dotIndex, hashIndex ) );

	return childDoclet.longname + name;
}

// Checks if memberDoclet was inherited from a parent class.
function checkIfAddInheritedProperty( allDoclets, childDoclet, memberDoclet, relation ) {
	if ( relation === 'augmentsNested' ) {
		return true;
	}

	const memberDocletParent = allDoclets.find( d => d.longname === memberDoclet.memberof );
	let result = false;

	if ( isNonEmptyArray( memberDocletParent.descendants ) ) {
		memberDocletParent.descendants.forEach( longname => {
			const doclet = allDoclets.find( d => d.longname === longname );

			if ( doclet.kind === 'class' ) {
				if ( isNonEmptyArray( doclet.descendants ) &&
					doclet.descendants.indexOf( childDoclet.longname ) !== -1 ) {
					result = true;
				}
			}
		} );
	}

	return result;
}

function checkIfExplicitlyInherits( doclets ) {
	for ( const doclet of doclets ) {
		if ( doclet.inheritdoc || doclet.override ) {
			return true;
		}
	}

	return false;
}
