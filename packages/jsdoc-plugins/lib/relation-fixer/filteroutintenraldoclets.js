/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Filters out doclet that won't be displayed.
 *
 * @param {Array.<Doclet>} doclets
 */
module.exports = function filterOutInternalDoclets( doclets ) {
	return doclets
		.filter( doclet => !doclet.ignore )
		.filter( doclet => doclet.memberof != '<anonymous>' );
};
