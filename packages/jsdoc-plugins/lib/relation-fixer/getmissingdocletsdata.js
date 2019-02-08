/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */
// @ts-check

'use strict';

const cloneDeep = require( 'lodash' ).cloneDeep;

module.exports = getMissingDocletsData;

/**
 * Gets missing doclets of members coming from implemented interfaces and extended classes.
 * Returns also doclets which should be ignored as no longer necessary.
 * This module requires the input to be processed by 'buildrelations' first.
 *
 * @param {DocletCollection} docletCollection
 * @param {Doclet} interfaceClassOrMixinDoclet Doclet representing an entity which might have some inherited members missing.
 * @param {Object} options
 * @param {'augmentsNested'|'mixesNested'|'implementsNested'} options.relation Name of relation between child entity
 * and its ancestors.
 * @param {Object} [options.filter] Object used to filter missing doclets (e.g. { scope: 'static' }).
 * @param {Boolean} [options.onlyImplicitlyInherited]
 * @returns {{newDoclets: Doclet[], docletsWhichShouldBeIgnored: Doclet[]}}
 */
function getMissingDocletsData( docletCollection, interfaceClassOrMixinDoclet, options ) {
	const newDoclets = [];
	const docletsWhichShouldBeIgnored = [];
	const docletsToAdd = getDocletsToAdd( docletCollection, interfaceClassOrMixinDoclet, options );
	const docletMap = createDocletMap( docletCollection );

	for ( const docletToAdd of docletsToAdd ) {
		const clonedDoclet = cloneDeep( docletToAdd );

		clonedDoclet.longname = getLongnameForNewDoclet( docletToAdd, interfaceClassOrMixinDoclet );
		clonedDoclet.memberof = interfaceClassOrMixinDoclet.longname;

		// Add property `inherited` or `mixed`.
		const relationProperty = getRelationProperty( docletMap, interfaceClassOrMixinDoclet, docletToAdd, options.relation );

		if ( relationProperty ) {
			clonedDoclet[ relationProperty ] = true;
		}

		const docletsOfSameMember = docletCollection.get( `memberof:${ clonedDoclet.memberof }` ).filter( d => {
			return d.name === clonedDoclet.name && d.kind === clonedDoclet.kind;
		} );

		if ( docletsOfSameMember.length === 0 ) {
			if ( clonedDoclet.longname === 'module:engine/controller/datacontroller~DataController#set' ) {
				console.log( { childDoclet: interfaceClassOrMixinDoclet } );
				console.log( '\n' );
				console.log( { docletsOfSameMember } );
				console.log( '\n' );
				console.log( { clonedDoclet } );
				console.log( '\n' );
				console.log( { options } );
				console.log( '\n' );
				console.log( relationProperty );
				console.log( '\n\n\n' );
			}

			// If there was no doclet for that member, simply add it to new doclets.
			newDoclets.push( clonedDoclet );
		} else if ( doAllParentsExplicitlyInherit( docletsOfSameMember ) && !options.onlyImplicitlyInherited ) {
			// If doclet for that member already existed and used `inheritdoc` or `overrides`.
			// Add `ignore` property to existing doclets. Unless 'onlyImplicitlyInherited' option is set.
			docletsWhichShouldBeIgnored.push( ...docletsOfSameMember );
			newDoclets.push( clonedDoclet );
		} else if ( docletsOfSameMember.length >= 2 ) {
			if ( docletsOfSameMember.find( doclet => {
				return doclet.longname === 'module:engine/controller/datacontroller~DataController#set';
			} ) ) {
				console.log( { childDoclet: interfaceClassOrMixinDoclet } );
				console.log( '\n' );
				console.log( { docletsOfSameMember } );
				console.log( '\n' );
				console.log( { clonedDoclet } );
				console.log( '\n' );
				console.log( { options } );
				console.log( '\n' );
				console.log( relationProperty );
				console.log( '\n\n\n' );
			}
		}
	}

	return {
		newDoclets,
		docletsWhichShouldBeIgnored
	};
}

/**
 * Gets doclets from entities related to current doclet (e.g. implemented by it)
 * and matching criteria given in options.filter.
 *
 * @param {DocletCollection} docletCollection
 * @param {Doclet} childDoclet
 * @param {Object} options
 * @param {'augmentsNested'|'mixesNested'|'implementsNested'} options.relation
 * @param {Partial<Doclet>} [options.filter] An object used to filter missing doclets (e.g. { scope: 'static' }).
 */
function getDocletsToAdd( docletCollection, childDoclet, options ) {
	if ( !isNonEmptyArray( childDoclet[ options.relation ] ) ) {
		return [];
	}

	// Longnames of doclets which are related ( extended, mixed, implemented ) to childDoclet.
	const ancestors = childDoclet[ options.relation ];

	const docletToAdd = ancestors.reduce( ( /** @type {Array.<Doclet>} */ docletsToAdd, longname ) => {
		const toAdd = docletCollection.get( `memberof:${ longname }` ).filter( doclet => {
			let matchingFilterOptions = true;

			// Filter out ignored, inherited, undocumented.
			if ( doclet.ignore ||
				doclet.undocumented ||
				typeof doclet.inheritdoc == 'string'
			) {
				return false;
			}

			for ( const key of Object.keys( options.filter || {} ) ) {
				if ( doclet[ key ] !== options.filter[ key ] ) {
					matchingFilterOptions = false;
				}
			}

			return matchingFilterOptions;
		} );

		return [
			...docletsToAdd,
			...toAdd
		];
	}, [] );

	return docletToAdd;
}

function isNonEmptyArray( obj ) {
	return Array.isArray( obj ) && obj.length > 0;
}

/**
 * @param {Doclet} parentDoclet
 * @param {Doclet} childDoclet
 */
function getLongnameForNewDoclet( parentDoclet, childDoclet ) {
	const dotIndex = parentDoclet.longname.lastIndexOf( '.' );
	const hashIndex = parentDoclet.longname.lastIndexOf( '#' );
	const name = parentDoclet.longname.slice( Math.max( dotIndex, hashIndex ) );

	return childDoclet.longname + name;
}

/**
 * Gets property which should be added to the new doclet (e.g. inherited, mixed).
 *
 * @param {Readonly<DocletMap>} docletMap
 * @param {Readonly<Doclet>} childDoclet
 * @param {Readonly<Doclet>} memberDoclet
 * @param {'augmentsNested'|'mixesNested'|'implementsNested'} relation
 * @returns {'inherited'|'mixed'|null}
 */
function getRelationProperty( docletMap, childDoclet, memberDoclet, relation ) {
	if ( relation === 'augmentsNested' ) {
		return 'inherited';
	}

	if ( relation === 'mixesNested' ) {
		return 'mixed';
	}

	const memberDocletParent = docletMap[ memberDoclet.memberof ];

	let isInherited = false;
	let isMixed = false;

	// If doclet is a child of a mixin, it's 'mixed'. Else if it's a child of another class, it's 'inhertied'.
	if ( isNonEmptyArray( memberDocletParent.descendants ) ) {
		for ( const longname of memberDocletParent.descendants ) {
			const doclet = docletMap[ longname ];

			if ( doclet && doclet.kind === 'mixin' ) {
				if ( isNonEmptyArray( doclet.descendants ) &&
					doclet.descendants.indexOf( childDoclet.longname ) !== -1 ) {
					isMixed = true;
				}
			} else if ( doclet && doclet.kind === 'class' ) {
				if ( isNonEmptyArray( doclet.descendants ) &&
					doclet.descendants.indexOf( childDoclet.longname ) !== -1 ) {
					isInherited = true;
				}
			}
		}
	}

	if ( isMixed ) {
		return 'mixed';
	} else if ( isInherited ) {
		return 'inherited';
	} else {
		return null;
	}
}

/**
 * @param {Doclet[]} doclets
 */
function doAllParentsExplicitlyInherit( doclets ) {
	for ( const doclet of doclets ) {
		if ( doclet.inheritdoc === undefined && doclet.overrides === undefined ) {
			return false;
		}
	}

	return true;
}

/**
 * Creates a <longname, doclet> map.
 *
 * @param {DocletCollection} doclets
 * @returns {DocletMap}
 */
function createDocletMap( doclets ) {
	/** @type {DocletMap} */
	const docletMap = {};

	for ( const doclet of doclets.getAll().reverse() ) {
		docletMap[ doclet.longname ] = doclet;
	}

	return docletMap;
}

/** @typedef {{ [longname: string]: Doclet}} DocletMap */

/** @typedef {import('../utils/doclet-collection')} DocletCollection */
