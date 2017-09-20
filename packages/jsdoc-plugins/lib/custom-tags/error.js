/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

module.exports = {
	// See http://usejsdoc.org/about-plugins.html#tag-definition.
	defineTags( dictionary ) {
		dictionary.defineTag( 'error', {
			mustHaveValue: true,
			mustNotHaveDescription: false,
			canHaveType: true,
			canHaveName: true,
			onTagged( doclet, tag ) {
				Object.assign( doclet, {
					name: tag.value.name,
					longname: `module:errors/${ tag.value.name }`,
					kind: 'error',
					memberof: 'module:errors',
					scope: 'inner'
				} );
			}
		} );
	},
};
