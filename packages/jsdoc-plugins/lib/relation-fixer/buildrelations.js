/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { cloneDeep, uniq } = require( 'lodash' );
const DocletCollection = require( '../utils/doclet-collection' );
const RELATIONS = {
	implements: 'implementsNested',
	mixes: 'mixesNested',
	augments: 'augmentsNested'
};

module.exports = buildRelations;

/**
 * Checks ascendants of every doclet and adds them to the relation array.
 * Handles nested inheritance, mixins and implementation of interfaces.
 * Also adds descendants to doclet. Descendants are entities that extend, implement or mix a doclet.
 * For example: If ClassB extends ClassA and ClassA implements InterfaceC,
 * ClassB and ClassA will have a property 'implementsNested': [ 'InterfaceC' ],
 * also InterfaceC will have a property 'descendants': [ 'ClassA', 'ClassB' ] etc.
 *
 * @param {Array.<Doclet>} doclets
 * @returns {Array.<Doclet>}
 */
function buildRelations( doclets ) {
	// Preserve original doclets from modification for easier testing.
	doclets = cloneDeep( doclets );

	/**
	 * Doclets grouped by their longnames.
	 */
	const docletCollection = new DocletCollection();

	for ( const doclet of doclets ) {
		docletCollection.add( doclet.longname, doclet );
	}

	/**
	 * An array of doclets, for which we want to create relation arrays.
	 */
	const subjectDoclets = doclets.filter( item => {
		return (
			item.kind === 'class' ||
			item.kind === 'interface' ||
			item.kind === 'mixin' ||
			item.kind === 'typedef'
		);
	} );

	for ( const doclet of subjectDoclets ) {
		const related = getAncestors( docletCollection, doclet, {
			relations: [ 'augments', 'implements', 'mixes' ]
		} );

		// Remove duplicates.
		for ( const relation of Object.keys( related ) ) {
			related[ relation ] = uniq( related[ relation ] );
		}

		Object.assign( doclet, related );
	}

	for ( const doclet of subjectDoclets ) {
		doclet.descendants = uniq( getDescendants( subjectDoclets, doclet ) );
	}

	return doclets;
}

/**
 * Gets long names of the current doclet ancestors (classes it extends, interfaces it implements and so on).
 *
 * @param {DocletCollection} docletCollection Doclets grouped by their longnames
 * @param {Doclet} currentDoclet
 * @param {Object} options
 * @param {Array.<'augments'|'implements'|'mixes'>} options.relations An array of relation names which should be used.
 * @returns {Object} An object containing arrays of ancestors' longnames.
 */
function getAncestors( docletCollection, currentDoclet, options ) {
	const { relations } = options;

	/** @type {Object} */
	const resultRelations = {};

	// Initialize the returned object.
	for ( const baseRelation of relations ) {
		resultRelations[ RELATIONS[ baseRelation ] ] = [];
	}

	// For every relation take doclets which are related to current doclet and run `getAncestors` function on them recursively.
	for ( const baseRelation of relations ) {
		const relation = RELATIONS[ baseRelation ];

		if ( isEmpty( currentDoclet[ baseRelation ] ) ) {
			continue;
		}

		resultRelations[ relation ].push( ...currentDoclet[ baseRelation ] );

		for ( const longname of currentDoclet[ baseRelation ] ) {
			const ancestors = docletCollection.get( longname );

			for ( const ancestor of ancestors ) {
				const ancestorsResultRelations = getAncestors( docletCollection, ancestor, {
					relations
				} );

				// Push relation arrays of doclet's ancestors to current doclet resultRelations.
				for ( const key of Object.keys( resultRelations ) ) {
					// Only items of same kind can be put in inheritance tree. See #361.
					if ( key === 'augmentsNested' && ancestor.kind !== currentDoclet.kind ) {
						continue;
					}

					resultRelations[ key ].push( ...ancestorsResultRelations[ key ] );
				}
			}
		}
	}

	return resultRelations;
}

/**
 * Returns `true` when the input in equal to `undefined` or is an empty array.
 *
 * @param {Array|undefined} arr
 */
function isEmpty( arr ) {
	return !arr || arr.length === 0;
}

/**
 * Gets long names of descendants – i.e. entities which extend, implement or mix a doclet.
 *
 * @param {Array.<Doclet>} searchedDoclets
 * @param {Doclet} currentDoclet
 * @returns {Array.<String>} An array of long names.
 */
function getDescendants( searchedDoclets, currentDoclet ) {
	/** @type {Set.<String>} */
	const descendants = new Set();

	for ( const doclet of searchedDoclets ) {
		for ( const baseRelation in RELATIONS ) {
			const relation = RELATIONS[ baseRelation ];

			if (
				!isEmpty( doclet[ relation ] ) &&
				doclet[ relation ].includes( currentDoclet.longname )
			) {
				descendants.add( doclet.longname );
				break;
			}
		}
	}

	return Array.from( descendants );
}
