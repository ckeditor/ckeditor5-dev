/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/** @type {Array.<Doclet>} */
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
