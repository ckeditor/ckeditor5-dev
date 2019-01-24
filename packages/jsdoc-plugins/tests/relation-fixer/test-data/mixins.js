/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

module.exports = [
	{
		name: 'mixinA',
		longname: 'mixinA',
		kind: 'mixin'
	},
	{
		name: 'mixedProp',
		longname: 'mixinA.mixedProp',
		kind: 'event',
		memberof: 'mixinA',
		description: 'mixedProp description'
	},
	{
		name: 'classA',
		longname: 'classA',
		kind: 'class',
		mixesNested: [ 'mixinA' ]
	},
	{
		name: 'classAProp',
		longname: 'classA.prop',
		kind: 'member',
		scope: 'static',
		memberof: 'classA'
	},
	{
		name: 'mixedProp',
		longname: 'classA.mixedProp',
		kind: 'event',
		memberof: 'classA',
		inheritdoc: ''
	},
	{
		name: 'classB',
		longname: 'classB',
		kind: 'class',
		augments: [
			'classA'
		],
		augmentsNested: [
			'classA'
		],
		mixesNested: [ 'mixinA' ]
	},
];
