/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

/* jshint mocha:true */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const addMissingDoclets = require( '../../lib/relation-fixer/addmissingdoclets' );
const cloneDeep = require( 'lodash' ).cloneDeep;

describe( 'Plugin adds missing doclets from relation chain', () => {
	it( 'should add missing doclets coming from interfaces', () => {
		const testDoclets = require( './test-data/interface' );
		const doclets = cloneDeep( testDoclets );
		const expectedDoclet = {
			name: 'intAProperty',
			longname: 'classB.intAProperty',
			kind: 'member',
			memberof: 'classB',
			scope: 'static',
			description: 'intAProp description',
			inherited: true
		};

		addMissingDoclets( doclets );
		expect( doclets ).to.deep.include( expectedDoclet );
	} );

	it( 'should add missing doclets coming from extended classes implicitly', () => {
		const testDoclets = require( './test-data/inheritance-implicit' );
		const doclets = cloneDeep( testDoclets );
		const expectedDoclet = {
			name: 'classAProp',
			longname: 'classB.prop',
			kind: 'member',
			scope: 'static',
			memberof: 'classB',
			inherited: true
		};

		addMissingDoclets( doclets );
		expect( doclets ).to.deep.include( expectedDoclet );
	} );

	it( 'should add missing doclets coming from extended classes with use of `inheritdoc`', () => {
		const testDoclets = require( './test-data/inheritance-inheritdoc' );
		const doclets = cloneDeep( testDoclets );
		const expectedDoclet = {
			name: 'classAProp',
			longname: 'classB.prop',
			kind: 'member',
			scope: 'static',
			memberof: 'classB',
			description: 'Class A prop description',
			inherited: true
		};

		addMissingDoclets( doclets );
		expect( doclets ).to.deep.include( expectedDoclet );
	} );

	it( 'should ignore exising doclets when `inheritdoc` was used', () => {
		const testDoclets = require( './test-data/inheritance-inheritdoc' );
		const doclets = cloneDeep( testDoclets );
		const expectedDoclet = {
			name: 'classAProp',
			longname: 'classB.prop',
			kind: 'member',
			scope: 'static',
			memberof: 'classB',
			inheritdoc: true,
			ignore: true
		};

		addMissingDoclets( doclets );
		expect( doclets ).to.deep.include( expectedDoclet );
	} );
} );
