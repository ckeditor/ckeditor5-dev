/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

/* jshint mocha:true */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const buildRelations = require( '../../lib/relation-fixer/buildrelations' );

describe( 'JSDoc relation-fixer buildrelations module', () => {
	let testDoclets;

	beforeEach( () => {
		testDoclets = [
			{
				name: 'interfaceA',
				longname: 'interfaceA',
				kind: 'interface'
			},
			{
				name: 'interfaceB',
				longname: 'interfaceB',
				kind: 'interface'
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
				implements: [
					'interfaceA'
				],
				mixes: [ 'mixinA' ]
			},
			{
				name: 'classB',
				longname: 'classB',
				kind: 'class',
				augments: [
					'classA'
				]
			}
		];
	} );

	it( 'should add implementation chain array to doclets', () => {
		const newDoclets = buildRelations( testDoclets );
		const testedDoclet = newDoclets.find( d => d.longname === 'classB' );
		const expectedProp = [
			'interfaceA',
			'interfaceB'
		];

		expect( testedDoclet ).to.have.property( 'implementsNested' ).and.to.eql( expectedProp );
	} );

	it( 'should add mixing chain array to doclets', () => {
		const newDoclets = buildRelations( testDoclets );
		const testedDoclet = newDoclets.find( d => d.longname === 'classB' );
		const expectedProp = [
			'mixinA'
		];

		expect( testedDoclet ).to.have.property( 'mixesNested' ).and.to.eql( expectedProp );
	} );

	it( 'should add inheritance chain array to doclets', () => {
		const newDoclets = buildRelations( testDoclets );
		const testedDoclet = newDoclets.find( d => d.longname === 'classB' );
		const expectedProp = [
			'classA'
		];

		expect( testedDoclet ).to.have.property( 'augmentsNested' ).and.to.eql( expectedProp );
	} );

	it( 'should add descendants chain array to doclets', () => {
		const newDoclets = buildRelations( testDoclets );
		const testedDoclet = newDoclets.find( d => d.longname === 'interfaceB' );
		const expectedProp = [
			'mixinA',
			'classA',
			'classB'
		];

		expect( testedDoclet ).to.have.property( 'descendants' ).and.to.eql( expectedProp );
	} );
} );
