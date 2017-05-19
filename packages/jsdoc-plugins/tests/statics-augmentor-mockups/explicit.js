/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

module.exports = {
	inputDoclets: [
		{
			// No change expected.
			kind: 'class',
			name: 'ParentClass',
			description: 'Parent Class description',
			longname: 'parent_class',
			scope: 'global'
		},
		{
			// Explicitly inherited by child class with own docs.
			kind: 'member',
			name: 'thirdParentProperty',
			description: 'Third parent property description',
			longname: 'parent_class.thirdParentProperty',
			memberof: 'parent_class',
			scope: 'static'
		},
		{
			// No change expected.
			kind: 'class',
			name: 'ChildClass',
			description: 'Child class description',
			longname: 'child_class',
			scope: 'global',
			augments: [ 'parent_class' ]
		},
		{
			// This doclet explicitly inherits `thirdParentProperty` and has its own docs.
			// Should have `overrides` property added after running plugin.
			kind: 'member',
			name: 'thirdParentProperty',
			description: 'Overriden third parent property description',
			longname: 'child_class.thirdParentProperty',
			memberof: 'child_class',
			scope: 'static'
		}
	],
	expectedResult: [
		{
			// No change expected.
			kind: 'class',
			name: 'ParentClass',
			description: 'Parent Class description',
			longname: 'parent_class',
			scope: 'global'
		},
		{
			// Explicitly inherited by child class with own docs.
			kind: 'member',
			name: 'thirdParentProperty',
			description: 'Third parent property description',
			longname: 'parent_class.thirdParentProperty',
			memberof: 'parent_class',
			scope: 'static'
		},
		{
			// No change expected.
			kind: 'class',
			name: 'ChildClass',
			description: 'Child class description',
			longname: 'child_class',
			scope: 'global',
			augments: [ 'parent_class' ]
		},
		{
			// This doclet explicitly inherits `thirdParentProperty` and has its own docs.
			// Should have `overrides` property added after running plugin.
			kind: 'member',
			name: 'thirdParentProperty',
			description: 'Overriden third parent property description',
			longname: 'child_class.thirdParentProperty',
			memberof: 'child_class',
			scope: 'static',
			overrides: 'parent_class.thirdParentProperty'
		}
	]
};
