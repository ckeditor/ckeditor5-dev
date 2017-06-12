/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const addMissingDoclets = require( '../../lib/relation-fixer/addmissingdoclets' );
const interfaceTestData = require( './test-data/interface' );
const inheritanceImplicitTestData = require( './test-data/inheritance-implicit' );
const inheritanceInheritdocTestData = require( './test-data/inheritance-inheritdoc' );
const cloneDeep = require( 'lodash' ).cloneDeep;

describe( 'Plugin adds missing doclets from relation chain', () => {
	let interfaceTestDoclets;
	let inheritanceImplicitTestDoclets;
	let inheritanceInheritdocTestDoclets;

	beforeEach( () => {
		interfaceTestDoclets = cloneDeep( interfaceTestData );
		inheritanceImplicitTestDoclets = cloneDeep( inheritanceImplicitTestData );
		inheritanceInheritdocTestDoclets = cloneDeep( inheritanceInheritdocTestData );
	} );

	it( 'should add missing doclets coming from interfaces', () => {
		const expectedDoclet = {
			name: 'intAProperty',
			longname: 'classB.intAProperty',
			kind: 'member',
			memberof: 'classB',
			scope: 'static',
			description: 'intAProp description',
			inherited: true
		};

		const newDoclets = addMissingDoclets( interfaceTestDoclets );
		expect( newDoclets ).to.deep.include( expectedDoclet );
	} );

	it( 'should add missing doclets coming from extended classes implicitly', () => {
		const expectedDoclet = {
			name: 'classAProp',
			longname: 'classB.prop',
			kind: 'member',
			scope: 'static',
			memberof: 'classB',
			inherited: true
		};

		const newDoclets = addMissingDoclets( inheritanceImplicitTestDoclets );
		expect( newDoclets ).to.deep.include( expectedDoclet );
	} );

	it( 'should add missing doclets coming from extended classes with use of `inheritdoc`', () => {
		const expectedDoclet = {
			name: 'classAProp',
			longname: 'classB.prop',
			kind: 'member',
			scope: 'static',
			memberof: 'classB',
			description: 'Class A prop description',
			inherited: true
		};

		const newDoclets = addMissingDoclets( inheritanceInheritdocTestDoclets );
		expect( newDoclets ).to.deep.include( expectedDoclet );
	} );

	it( 'should ignore exising doclets when `inheritdoc` was used', () => {
		const expectedDoclet = {
			name: 'classAProp',
			longname: 'classB.prop',
			kind: 'member',
			scope: 'static',
			memberof: 'classB',
			inheritdoc: true,
			ignore: true
		};

		const newDoclets = addMissingDoclets( inheritanceInheritdocTestDoclets );
		expect( newDoclets ).to.deep.include( expectedDoclet );
	} );
} );
