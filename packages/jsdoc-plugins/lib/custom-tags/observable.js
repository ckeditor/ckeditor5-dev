/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
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
