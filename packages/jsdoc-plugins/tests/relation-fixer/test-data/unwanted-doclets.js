/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

module.exports = [
	{
		name: 'classA',
		longname: 'classA',
		kind: 'class'
	},
	{
		name: 'classAPropA',
		longname: 'classA.propA',
		kind: 'member',
		scope: 'static',
		memberof: 'classA',
		inheritdoc: ''
	},
	{
		name: 'classAPropB',
		longname: 'classA.propB',
		kind: 'member',
		scope: 'static',
		memberof: 'classA',
		ignore: true
	},
	{
		name: 'classAPropC',
		longname: 'classA.propC',
		kind: 'member',
		scope: 'static',
		memberof: 'classA',
		undocumented: true
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
		]
	},
];
