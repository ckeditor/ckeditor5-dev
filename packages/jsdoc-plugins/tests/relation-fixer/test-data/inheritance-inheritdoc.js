/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/** @type {Array.<Doclet>} */
module.exports = [
	{
		name: 'classA',
		longname: 'classA',
		kind: 'class'
	},
	{
		name: 'classAProp',
		longname: 'classA.prop',
		kind: 'member',
		scope: 'static',
		memberof: 'classA',
		description: 'Class A prop description'
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
	{
		name: 'classAProp',
		longname: 'classB.prop',
		kind: 'member',
		scope: 'static',
		memberof: 'classB',
		inheritdoc: ''
	}
];
