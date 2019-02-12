/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */
// @ts-check

'use strict';

/**
 * Filters out doclet that won't be displayed.
 *
 * @param {Array.<Doclet>} doclets
 */
module.exports = function filterOutInternalDoclets( doclets ) {
	return doclets
		.filter( doclet => !doclet.ignore )
		.filter( doclet => doclet.memberof != '<anonymous>' )
		.filter( doclet => filterOutReExportedSymbols( doclet, doclets ) );
};

/**
 * @param {Doclet} doclet
 * @param {Array.<Doclet>} doclets
 */
function filterOutReExportedSymbols( doclet, doclets ) {
	// Filter out exported symbols that are defined previously (JSDoc creates doclets for both).
	const isUnwanted = ( doclet.scope == 'inner' && doclet.kind == 'constant' && doclet.undocumented );

	if ( isUnwanted ) {
		if ( doclets.find( d => doclet.longname === d.longname && d !== doclet ) ) {
			return false;
		}
	}

	return true;
}
