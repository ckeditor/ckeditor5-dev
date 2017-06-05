/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

/* jshint mocha:true */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const relationBuilder = require( '../../lib/relation-fixer/relationbuilder' );
const addMissingDoclets = require( '../../lib/relation-fixer/addmissingdoclets' );
const cloneDeep = require( 'lodash' ).cloneDeep;
const testDoclets = [
	{
		name: 'interfaceB',
		longname: 'interfaceB',
		kind: 'interface'
	},
	{
		name: 'interfaceBProp',
		longname: 'interfaceB.prop',
		kind: 'member',
		scope: 'static',
		memberof: 'interfaceB',
		description: 'Interface B prop description'
	},
	{
		name: 'mixinA',
		longname: 'mixinA',
		kind: 'mixin',
		implements: [
			'interfaceB'
		]
	},
	{
		name: 'classA',
		longname: 'classA',
		kind: 'class',
		mixes: [ 'mixinA' ]
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

describe( 'Adding missing doclets through relation chain', () => {
	it( 'should add missing doclet through relation chain', () => {
		const doclets = cloneDeep( testDoclets );
		const expectedDoclet = {
			name: 'interfaceBProp',
			longname: 'classB.prop',
			kind: 'member',
			scope: 'static',
			memberof: 'classB',
			description: 'Interface B prop description',
			inherited: true
		};

		addMissingDoclets( relationBuilder( doclets ) );
		expect( doclets ).to.deep.include( expectedDoclet );
	} );

	it( 'should add missing doclet to other links of relation chain', () => {
		const doclets = cloneDeep( testDoclets );
		const expectedDoclet = {
			name: 'interfaceBProp',
			longname: 'mixinA.prop',
			kind: 'member',
			scope: 'static',
			memberof: 'mixinA',
			description: 'Interface B prop description'
		};

		addMissingDoclets( relationBuilder( doclets ) );
		expect( doclets ).to.deep.include( expectedDoclet );
	} );
} );
