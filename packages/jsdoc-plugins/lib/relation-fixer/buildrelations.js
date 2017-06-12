/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const cloneDeep = require( 'lodash' ).cloneDeep;
const RELATIONS = {
	'implements': 'implementsNested',
	'mixes': 'mixesNested',
	'augments': 'augmentsNested'
};

module.exports = addRelationArrays;

/**
 * Checks ascendants of every doclet and adds them to relation array.
 * Handles nested inheritance, mixins and implementation of interfaces.
 * Also adds array of descendants to doclet. Descendants are entities which extend, implement or mix a doclet.
 * For example: If ClassB extends ClassA and ClassA implements InterfaceC,
 * ClassB and ClassA will have a property 'implementsNested': [ 'InterfaceC' ],
 * also InterfaceC will have a property 'descendants': [ 'ClassA', 'ClassB' ] etc.
 *
 * @param {Array.<Doclet>} originalDoclets
 * @returns {Array.<Doclet>}
 */
function addRelationArrays( originalDoclets ) {
	const clonedDoclets = cloneDeep( originalDoclets );

	// Doclets for which we want to create relation arrays.
	// We want classes, interfaces and mixins.
	const subjectDoclets = clonedDoclets.filter( item => {
		return item.kind === 'class' || item.kind === 'interface' || item.kind === 'mixin';
	} );

	subjectDoclets.forEach( d => {
		const related = getAncestors( clonedDoclets, d, {
			relations: [ 'augments', 'implements', 'mixes' ]
		} );

		Object.assign( d, related );
	} );

	subjectDoclets.forEach( d => {
		const descendants = getDescendants( subjectDoclets, d );

		Object.assign( d, { descendants } );
	} );

	return clonedDoclets;
}

// Gets longnames of currentDoclet's ancestors ( classes it extends, interfaces it implements and so on ).
//
// @param {Array.<Doclet>} allDoclets
// @param {Doclet} currentDoclet
// @param {Array} options.relations Array of relation names which should be used
// @returns {Object} An object containing arrays of ancestors' longnames
function getAncestors( allDoclets, currentDoclet, options ) {
	const { relations } = options;
	const resultRelations = {};

	// Init return object
	relations.forEach( r => {
		resultRelations[ RELATIONS[ r ] ] = [];
	} );

	// For every relation take doclets which are related to current doclet and run `getAncestors` function on them recursively.
	relations.forEach( r => {
		if ( isNonEmptyArray( currentDoclet[ r ] ) ) {
			resultRelations[ RELATIONS[ r ] ].push( ...currentDoclet[ r ] );

			currentDoclet[ r ].forEach( longname => {
				const ancestors = allDoclets.filter( d => d.longname === longname );

				ancestors.forEach( ancestor => {
					const ancestorsResultRelations = getAncestors( allDoclets, ancestor, {
						relations
					} );

					// Push relation arrays of doclet's ancestors to current doclet resultRelations.
					for ( const key of Object.keys( resultRelations ) ) {
						resultRelations[ key ].push( ...ancestorsResultRelations[ key ] );
					}
				} );
			} );
		}
	} );

	return resultRelations;
}

function isNonEmptyArray( obj ) {
	return Array.isArray( obj ) && obj.length > 0;
}

// Gets longnames of descendants i.e. entities which extend, implement or mix a doclet.
//
// @param {Array.<Doclet>} searchedDoclets
// @param {Doclet} currentDoclet
// @returns {Array.<String>} Array of longnames
function getDescendants( searchedDoclets, currentDoclet ) {
	const descendants = new Set();

	for ( const doclet of searchedDoclets ) {
		for ( const r of Object.keys( RELATIONS ) ) {
			if ( isNonEmptyArray( doclet[ RELATIONS[ r ] ] ) && doclet[ RELATIONS[ r ] ].includes( currentDoclet.longname ) ) {
				descendants.add( doclet.longname );
				break;
			}
		}
	}

	return [ ...descendants ];
}
