/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const isNonEmptyArray = require( './utils/isnonemptyarray' );
const cloneDeep = require( 'lodash' ).cloneDeep;

/**
 * Adds missing doclets of static members coming from implemented interfaces and extended classes.
 * JSDoc does not support inheritance of static members.
 * This module requires the input to be processed by 'relationbuilder' first.
 *
 * @param {Array.<Doclet>} data
 * @returns {Array.<Doclet>} data
 */
module.exports = data => {
	const newDoclets = [];
	const entitiesWhichNeedNewDoclets = data.filter( d => {
		return d.kind === 'class' || d.kind === 'interface' || d.kind === 'mixin';
	} );

	// Creates new doclets which given childDoclet is missing.
	function getNewDoclets( childDoclet, relation, options ) {
		const docletsToAdd = getDocletsToAdd( childDoclet, relation, options );
		const newDoclets = [];

		docletsToAdd.forEach( d => {
			const cloned = cloneDeep( d );
			let docletsWithSameLongname = [];

			cloned.longname = getNewLongname( d, childDoclet );
			cloned.memberof = childDoclet.longname;

			// Add property `inherited`
			if ( checkIfAddInheritedProperty( childDoclet, d, relation ) ) {
				cloned.inherited = true;
			}

			docletsWithSameLongname = data.filter( d => d.longname === cloned.longname );

			if ( docletsWithSameLongname.length === 0 ) {
				// If there was no doclet for that member, simply add it to new doclets.
				newDoclets.push( cloned );
			} else if ( checkExplicitlyInherits( docletsWithSameLongname ) ) {
				// If doclet for that member already existed and used `inheritdoc` or`overrides`.
				// Add `ignore` property to existing doclets.
				docletsWithSameLongname.forEach( d => {
					d.ignore = true;
				} );

				newDoclets.push( cloned );
			}
		} );

		return newDoclets;
	}

	// Gets doclets from entities related to current doclet ( e.g. implemented by it ) and matching criteria given in options.
	function getDocletsToAdd( doclet, relation, options = {} ) {
		if ( !isNonEmptyArray( doclet[ relation ] ) ) {
			return [];
		}

		const parents = doclet[ relation ];
		const docletsToAdd = [];
		parents.forEach( ln => {
			const toAdd = data.filter( d => {
				let optionalCondition = true;

				for ( const key of Object.keys( options ) ) {
					if ( d[ key ] !== options[ key ] ) {
						optionalCondition = false;
					}
				}

				return d.memberof === ln && optionalCondition;
			} );

			docletsToAdd.push( ...toAdd );
		} );

		return docletsToAdd;
	}

	// Checks if memberDoclet was inherited from a parent class.
	function checkIfAddInheritedProperty( childDoclet, memberDoclet, relation ) {
		if ( relation === 'augmentsNested' ) {
			return true;
		}

		const memberDocletParent = data.find( d => d.longname === memberDoclet.memberof );
		let result = false;

		if ( isNonEmptyArray( memberDocletParent.descendants ) ) {
			memberDocletParent.descendants.forEach( ln => {
				const doclet = data.find( d => d.longname === ln );

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

	entitiesWhichNeedNewDoclets.forEach( d => {
		// Add missing static members from interfaces.
		newDoclets.push( ...getNewDoclets( d, 'implementsNested', {
			scope: 'static'
		} ) );
		// Add missing static members from extended classes.
		newDoclets.push( ...getNewDoclets( d, 'augmentsNested', {
			scope: 'static'
		} ) );
	} );

	data.push( ...newDoclets );

	return data;
};

function getNewLongname( parentDoclet, childDoclet ) {
	const dotIndex = parentDoclet.longname.lastIndexOf( '.' );
	const hashIndex = parentDoclet.longname.lastIndexOf( '#' );
	const name = parentDoclet.longname.slice( Math.max( dotIndex, hashIndex ) );

	return childDoclet.longname + name;
}

function checkExplicitlyInherits( doclets ) {
	for ( const doclet of doclets ) {
		if ( typeof doclet.inheritdoc !== 'undefined' || typeof doclet.override !== 'undefined' ) {
			return true;
		}
	}

	return false;
}
