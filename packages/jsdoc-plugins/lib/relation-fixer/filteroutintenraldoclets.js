/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */
// @ts-check

'use strict';

/**
 * Filters out doclet that won't be displayed.
 *
 * @param {Doclet[]} doclets
 */
module.exports = function filterOutInternalDoclets( doclets ) {
	return doclets
		.filter( doclet => !doclet.ignore )
		.filter( doclet => doclet.memberof != '<anonymous>' );
};
