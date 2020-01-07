/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

module.exports = [
	{
		name: 'interfaceA',
		longname: 'interfaceA',
		kind: 'interface',
		descendants: [
			'classA',
			'classB'
		]
	},
	{
		name: 'intAProperty',
		longname: 'interfaceA.intAProperty',
		kind: 'member',
		memberof: 'interfaceA',
		description: 'intAProp description'
	},
	{
		name: 'classA',
		longname: 'classA',
		kind: 'class',
		implements: [
			'interfaceA'
		],
		implementsNested: [ 'interfaceA' ],
		descendants: [ 'classB' ]
	},
	{
		name: 'classB',
		longname: 'classB',
		kind: 'class',
		augments: [
			'classA'
		],
		implementsNested: [ 'interfaceA' ],
		augmentsNested: [ 'classA' ]
	},
	{
		name: 'intAProperty',
		longname: 'classB.intAProperty',
		kind: 'member',
		memberof: 'classB',
		inheritdoc: ''
	}
];
