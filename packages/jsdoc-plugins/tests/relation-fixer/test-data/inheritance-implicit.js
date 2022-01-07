/**
 * @license Copyright (c) 2003-2022, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
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
		memberof: 'classA'
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
	}
];
