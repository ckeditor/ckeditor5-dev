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
			// Explicitly inherited by child class using `@inheritdoc` or `@overrides` tags.
			// `description` of this doclet should be used for new doclet added as member of child class.
			kind: 'member',
			name: 'anotherParentProperty',
			description: 'Another parent property description',
			longname: 'parent_class.anotherParentProperty',
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
			// This doclet explicitly inherits `anotherParentProperty`.
			// It should have `ignore: true` property added and new doclet should be added to replace this one.
			// New doclet should have `description`, `inherits`, `inherited`, `overrides` properties added from parent property.
			kind: 'member',
			name: 'anotherParentProperty',
			longname: 'child_class.anotherParentProperty',
			memberof: 'child_class',
			scope: 'static',
			inheritdoc: ''
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
			// Explicitly inherited by child class using `@inheritdoc` or `@overrides` tags.
			// `description` of this doclet should be used for new doclet added as member of child class.
			kind: 'member',
			name: 'anotherParentProperty',
			description: 'Another parent property description',
			longname: 'parent_class.anotherParentProperty',
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
			// This doclet explicitly inherits `anotherParentProperty`.
			// It should have `ignore: true` property added and new doclet should be added to replace this one.
			// New doclet should have `description`, `inherits`, `inherited`, `overrides` properties added from parent property.
			kind: 'member',
			name: 'anotherParentProperty',
			longname: 'child_class.anotherParentProperty',
			memberof: 'child_class',
			scope: 'static',
			inheritdoc: '',
			ignore: true
		},
		{
			// This is a new doclet created to replace the one above.
			// It should have `description`, `inherits`, `inherited`, `overrides` properties added.
			kind: 'member',
			name: 'anotherParentProperty',
			longname: 'child_class.anotherParentProperty',
			memberof: 'child_class',
			scope: 'static',
			inherited: true,
			inherits: 'parent_class.anotherParentProperty',
			overrides: 'parent_class.anotherParentProperty',
			description: 'Another parent property description'
		}
	]
};
