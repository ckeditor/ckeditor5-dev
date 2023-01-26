/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	// See http://usejsdoc.org/about-plugins.html#tag-definitions.
	defineTags( dictionary ) {
		dictionary.defineTag( 'observable', {
			onTagged( doclet ) {
				doclet.observable = true;
			}
		} );
	}
};
