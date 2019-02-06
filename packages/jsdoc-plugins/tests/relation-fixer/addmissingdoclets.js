/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const addMissingDoclets = require( '../../lib/relation-fixer/addmissingdoclets' );
const interfaceTestData = require( './test-data/interface' );
const inheritanceImplicitTestData = require( './test-data/inheritance-implicit' );
const inheritanceInheritdocTestData = require( './test-data/inheritance-inheritdoc' );
const unwantedDocletsTestData = require( './test-data/unwanted-doclets' );
const mixinTestData = require( './test-data/mixins' );
const cloneDeep = require( 'lodash' ).cloneDeep;

describe( 'JSDoc relation-fixer addmissingdoclets module', () => {
	let interfaceTestDoclets;
	let inheritanceImplicitTestDoclets;
	let inheritanceInheritdocTestDoclets;
	let unwantedTestDoclets;
	let mixinTestDoclets;

	beforeEach( () => {
		interfaceTestDoclets = cloneDeep( interfaceTestData );
		inheritanceImplicitTestDoclets = cloneDeep( inheritanceImplicitTestData );
		inheritanceInheritdocTestDoclets = cloneDeep( inheritanceInheritdocTestData );
		unwantedTestDoclets = cloneDeep( unwantedDocletsTestData );
		mixinTestDoclets = cloneDeep( mixinTestData );
	} );

	it( 'should add missing doclets coming from interfaces', () => {
		const expectedDoclet = {
			name: 'intAProperty',
			longname: 'classB.intAProperty',
			kind: 'member',
			memberof: 'classB',
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
			inheritdoc: '',
			ignore: true
		};

		const newDoclets = addMissingDoclets( inheritanceInheritdocTestDoclets );
		expect( newDoclets ).to.deep.include( expectedDoclet );
	} );

	it( 'should add missing doclets of mixed stuff', () => {
		const expectedDoclet = {
			name: 'mixedProp',
			longname: 'classB.mixedProp',
			kind: 'event',
			memberof: 'classB',
			description: 'mixedProp description',
			mixed: true
		};

		const newDoclets = addMissingDoclets( mixinTestDoclets );
		expect( newDoclets ).to.deep.include( expectedDoclet );
	} );

	it( 'should not add doclets of mixed stuff which already have own doclets', () => {
		const expectedDoclet = {
			name: 'mixedProp',
			longname: 'classA.mixedProp',
			kind: 'event',
			memberof: 'classA',
			description: 'mixedProp description',
			mixed: true
		};

		const newDoclets = addMissingDoclets( mixinTestDoclets );
		expect( newDoclets ).to.not.deep.include( expectedDoclet );
	} );

	it( 'should not add doclets which were already inherited (they have inheritdoc property)', () => {
		const newDoclets = addMissingDoclets( unwantedTestDoclets );
		const expectedDoclet = newDoclets.find( d => d.longname === 'classB.propA' );

		expect( expectedDoclet ).to.not.exist;
	} );

	it( 'should not add doclets which have `ignore: true` property', () => {
		const newDoclets = addMissingDoclets( unwantedTestDoclets );
		const expectedDoclet = newDoclets.find( d => d.longname === 'classB.propB' );

		expect( expectedDoclet ).to.not.exist;
	} );

	it( 'should not add doclets which have `undocumented: true` property', () => {
		const newDoclets = addMissingDoclets( unwantedTestDoclets );
		const expectedDoclet = newDoclets.find( d => d.longname === 'classB.propC' );

		expect( expectedDoclet ).to.not.exist;
	} );
} );
