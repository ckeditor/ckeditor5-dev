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
			// Implicitly inherited by child class.
			// This doclet should be added as new member of child class.
			// New doclet should have `description`, `memberof`, `inherits`, `inherited` properties added from parent property.
			kind: 'member',
			name: 'parentProperty',
			description: 'Parent property description',
			longname: 'parent_class.parentProperty',
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
			// Implicitly inherited by child class.
			// This doclet should be added as new member of child class.
			// New doclet should have `description`, `memberof`, `inherits`, `inherited` properties added from parent property.
			kind: 'member',
			name: 'parentProperty',
			description: 'Parent property description',
			longname: 'parent_class.parentProperty',
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
			// Implicitly inherited from parent class.
			// This doclet should be added as new member of child class.
			// It should have `description`, `memberof`, `inherits`, `inherited` properties added.
			kind: 'member',
			name: 'parentProperty',
			description: 'Parent property description',
			longname: 'child_class.parentProperty',
			memberof: 'child_class',
			scope: 'static',
			inherited: true,
			inherits: 'parent_class.parentProperty'
		}
	]
};
