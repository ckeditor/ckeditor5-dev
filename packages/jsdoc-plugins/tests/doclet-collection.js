/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const DocletCollection = require( '../lib/utils/doclet-collection' );

describe( 'collection', () => {
	let collection;

	beforeEach( () => {
		const docletA = {
			name: 'ClassA',
			longname: 'module:M~ClassA',
			kind: 'class'
		};
		const docletB = {
			name: 'methodB',
			longname: 'module:M~ClassA#methodB',
			kind: 'method'
		};
		collection = new DocletCollection();
		collection.add( docletA.kind, docletA );
		collection.add( docletB.kind, docletB );
	} );

	it( 'should return doclets filtered by category', () => {
		expect( collection.get( 'class' ) ).to.deep.equal(
			[
				{
					name: 'ClassA',
					longname: 'module:M~ClassA',
					kind: 'class'
				}
			]
		);
	} );

	it( 'should return all doclets', () => {
		expect( collection.getAll() ).to.deep.equal(
			[
				{
					name: 'ClassA',
					longname: 'module:M~ClassA',
					kind: 'class'
				},
				{
					name: 'methodB',
					longname: 'module:M~ClassA#methodB',
					kind: 'method'
				}
			]
		);
	} );

	it( 'should return all longnames of stored doclets', () => {
		expect( collection.getAllLongnames() ).to.deep.equal(
			[
				'module:M~ClassA',
				'module:M~ClassA#methodB'
			]
		);
	} );
} );
