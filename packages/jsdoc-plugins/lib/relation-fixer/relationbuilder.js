/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const RELATIONS = {
	'implements': 'implementsNested',
	'mixes': 'mixesNested',
	'augments': 'augmentsNested'
};
const DESCENDANTS_NAME = 'descendants';
const isNonEmptyArray = require( './utils/isnonemptyarray' );

/**
 * Checks ascendants of every doclet and adds them to relation chain.
 * Handles nested inheritance, mixins and implementation of interfaces.
 * Also adds descendants to doclet.
 * For example: If ClassB extends ClassA and ClassA implements InterfaceC,
 * ClassB and ClassA will have a property 'implementsNested': [ 'InterfaceC' ],
 * also InterfaceC will have a property 'descendants': [ 'ClassA', 'ClassB' ] etc.
 *
 * @param {Array.<Doclet>} data
 * @returns {Array.<Doclet>} data
 */
module.exports = data => {
	// Doclets for which we want to build a relation chain.
	// We want classes, interfaces and mixins which augment, implement or mix something.
	const childDoclets = data.filter( item => {
		const isOfProperKind = item.kind === 'class' || item.kind === 'interface' || item.kind === 'mixin';
		const hasAscendants = isNonEmptyArray( item.augments ) ||
			isNonEmptyArray( item.implements ) ||
			isNonEmptyArray( item.mixes );

		return isOfProperKind && hasAscendants;
	} );

	// Creates arrays of items which are implemented, mixed, augmented by a doclet.
	// Creates an array of doclet descendants.
	function handleChain( doclet, relations = [], options = {} ) {
		const result = {};
		let descendants = null;

		relations.forEach( r => {
			result[ RELATIONS[ r ] ] = [];
		} );

		// Add descendants to doclet.
		doclet[ DESCENDANTS_NAME ] = new Set( doclet[ DESCENDANTS_NAME ] );

		if ( options.descendants ) {
			options.descendants.forEach( d => {
				doclet[ DESCENDANTS_NAME ].add( d );
			} );
		}

		doclet[ DESCENDANTS_NAME ] = [ ...doclet[ DESCENDANTS_NAME ] ];

		// Add current doclet to descendants which will be passed to next iteration.
		descendants = new Set( doclet[ DESCENDANTS_NAME ] );
		descendants.add( doclet.longname );

		// For every relation take doclets which are related to current doclet and run `handleChain` function on them recursively.
		relations.forEach( r => {
			if ( isNonEmptyArray( doclet[ r ] ) ) {
				result[ RELATIONS[ r ] ].push( ...doclet[ r ] );

				doclet[ r ].forEach( ln => {
					const items = data.filter( d => d.longname === ln );

					items.forEach( item => {
						const ancestorsResult = handleChain( item, relations, {
							descendants
						} );

						// Push relation chain of doclet's ancestors to current doclet.
						for ( const key of Object.keys( result ) ) {
							result[ key ].push( ...ancestorsResult[ key ] );
						}
					} );
				} );
			}
		} );

		Object.assign( doclet, result );

		return result;
	}

	childDoclets.forEach( d => {
		handleChain( d, [ 'augments', 'implements', 'mixes' ] );
	} );

	return data;
};
