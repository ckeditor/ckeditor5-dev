/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/**
 * Filters out doclet that won't be displayed.
 *
 * @param {Array.<Doclet>} doclets
 */
module.exports = function filterOutInternalDoclets( doclets ) {
	doclets = doclets
		.filter( doclet => !doclet.ignore )
		.filter( doclet => doclet.memberof != '<anonymous>' );

	// return filterOutReExportedSymbols( doclets );

	return doclets;
};

/**
 * @param {Array.<Doclet>} doclets
 */
function filterOutReExportedSymbols( doclets ) {
	const constants = doclets.filter( doclet => doclet.kind === 'constant' );

	return doclets.filter( doclet => {
		// // Filter out exported symbols that are defined previously (JSDoc creates doclets for both).
		// const isUnwanted = ( doclet.scope == 'inner' && doclet.kind == 'constant' && doclet.undocumented );

		// if ( isUnwanted ) {
		// 	if ( constants.find( d => doclet.longname === d.longname && d !== doclet ) ) {
		// 		return false;
		// 	}
		// }

		return true;
	} );
}
