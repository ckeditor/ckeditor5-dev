/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { isEqual } = require( 'lodash' );

/**
 * This function is supposed to fix both constructor and class doclets.
 *
 * JSDoc completely messes up doclets for constructors and classes.
 * They are duplicated (where the only one contains valuable data), have invalid descriptions, etc.
 *
 * @param {Array.<Doclet>} doclets
 */
module.exports = function fixIncorrectClassConstructor( doclets ) {
	const knownConstructorDoclets = new Set();
	const knownDoclets = new Map();

	for ( const doclet of doclets ) {
		// Constructor doclets have the same longname as class doclets.
		if ( doclet.kind === 'class' && doclet.params ) {
			Object.assign( doclet, {
				longname: doclet.longname + '#constructor',
				memberof: doclet.longname,
				kind: 'function',
				scope: 'instance',
				name: 'constructor'
			} );

			if ( doclet.comment ) {
				delete doclet.undocumented;
			}
		}

		if ( doclet.kind === 'function' && doclet.name === 'constructor' ) {
			if ( knownConstructorDoclets.has( doclet.longname ) ) {
				doclet.ignore = true;
			}

			knownConstructorDoclets.add( doclet.longname );
		}

		if ( doclet.kind === 'class' && doclet.classdesc ) {
			if ( doclet.description && doclet.description !== doclet.classdesc ) {
				doclet.ignore = true;
			} else {
				if ( doclet.classdesc ) {
					delete doclet.undocumented;
				}
			}

			if ( !doclet.comment || doclet.comment.includes( '@inheritDoc' ) ) {
				doclet.ignore = true;
			}
		}

		// Remove duplicates (mostly they are created by the relation-fixer).
		// The whole relation-fixer's logic should be rewritten.
		if ( knownDoclets.has( doclet.longname ) && isEqual( doclet, knownDoclets.get( doclet.longname ) ) ) {
			doclet.ignore = true;
		}

		knownDoclets.set( doclet.longname, doclet );
	}
};
