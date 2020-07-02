/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/**
 * Marks constructor doclets as class special methods.
 * JSDoc saves creates constructor doclets as the second class doclet.
 *
 * @param {Doclet[]} doclets
 */
function fixIncorrectClassConstructor( doclets ) {
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

			continue;
		}
	}
}

module.exports = fixIncorrectClassConstructor;
