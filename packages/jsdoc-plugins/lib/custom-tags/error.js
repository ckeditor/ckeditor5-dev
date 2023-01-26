/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
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
	}
};
