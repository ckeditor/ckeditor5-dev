/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

/* jshint mocha:true */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const buildRelations = require( '../../lib/relation-fixer/buildrelations' );

describe( 'JSDoc relation-fixer buildrelations module', () => {
	let testDoclets;
	let testDoclets2;

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
					'interfaceB',
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
				mixes: [
					'mixinA',
					'mixinA'
				]
			},
			{
				name: 'classB',
				longname: 'classB',
				kind: 'class',
				augments: [
					'classA',
					'classA'
				]
			},
			{
				name: 'classB',
				longname: 'classB',
				kind: 'class',
				augments: [
					'classA',
					'classA'
				]
			}
		];

		testDoclets2 = [
			{
				name: 'interfaceA',
				longname: 'interfaceA',
				kind: 'interface'
			},
			{
				name: 'interfaceB',
				longname: 'interfaceB',
				kind: 'interface',
				augments: [ 'interfaceA' ]
			},
			{
				name: 'classA',
				longname: 'classA',
				kind: 'class',
				implements: [
					'interfaceB'
				]
			},
			{
				name: 'classB',
				longname: 'classB',
				kind: 'class',
				augments: [ 'classA' ]
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

		expectedProp.forEach( prop => {
			expect( testedDoclet ).to.have.property( 'implementsNested' ).and.to.include( prop );
		} );
	} );

	it( 'should add mixing chain array to doclets', () => {
		const newDoclets = buildRelations( testDoclets );
		const testedDoclet = newDoclets.find( d => d.longname === 'classB' );
		const expectedProp = [
			'mixinA'
		];

		expectedProp.forEach( prop => {
			expect( testedDoclet ).to.have.property( 'mixesNested' ).and.to.include( prop );
		} );
	} );

	it( 'should add inheritance chain array to doclets', () => {
		const newDoclets = buildRelations( testDoclets );
		const testedDoclet = newDoclets.find( d => d.longname === 'classB' );
		const expectedProp = [
			'classA'
		];

		expectedProp.forEach( prop => {
			expect( testedDoclet ).to.have.property( 'augmentsNested' ).and.to.include( prop );
		} );
	} );

	it( 'should add descendants chain array to doclets', () => {
		const newDoclets = buildRelations( testDoclets );
		const testedDoclet = newDoclets.find( d => d.longname === 'interfaceB' );
		const expectedProp = [
			'mixinA',
			'classA',
			'classB'
		];

		expectedProp.forEach( prop => {
			expect( testedDoclet ).to.have.property( 'descendants' ).and.to.include( prop );
		} );
	} );

	it( 'should not allow duplicates in relation arrays', () => {
		const newDoclets = buildRelations( testDoclets );
		const testedClass = newDoclets.find( d => d.longname === 'classB' );
		const testedInterface = newDoclets.find( d => d.longname === 'interfaceB' );

		// Removing duplicates.
		const expectedImplementsNested = Array.from( new Set( testedClass.implementsNested ) );
		const expectedMixesNested = Array.from( new Set( testedClass.mixesNested ) );
		const expectedAugmentsNested = Array.from( new Set( testedClass.augmentsNested ) );
		const expectedDescendants = Array.from( new Set( testedInterface.descendants ) );

		expect( testedClass ).to.have.property( 'implementsNested' ).and.to.deep.equal( expectedImplementsNested );
		expect( testedClass ).to.have.property( 'mixesNested' ).and.to.deep.equal( expectedMixesNested );
		expect( testedClass ).to.have.property( 'augmentsNested' ).and.to.deep.equal( expectedAugmentsNested );
		expect( testedInterface ).to.have.property( 'descendants' ).and.to.deep.equal( expectedDescendants );
	} );

	it( 'should not put non-classes to inheritance hierarchy', () => {
		const newDoclets = buildRelations( testDoclets2 );
		const testedDoclet = newDoclets.find( d => d.longname === 'classB' );

		expect( testedDoclet ).to.have.property( 'augmentsNested' ).and.to.deep.equal( [ 'classA' ] );
	} );
} );
