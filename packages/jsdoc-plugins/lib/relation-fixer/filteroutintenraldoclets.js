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
