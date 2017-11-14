/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const DocletCollection = require( '../lib/utils/doclet-collection' );

describe( 'collection', () => {
	let collection;

	beforeEach( () => {
		const recordA = {
			name: 'ClassA',
			longname: 'module:M~ClassA',
			kind: 'class'
		};
		const recordB = {
			name: 'methodB',
			longname: 'module:M~ClassA#methodB',
			kind: 'method'
		};
		collection = new DocletCollection();
		collection.add( recordA.kind, recordA );
		collection.add( recordB.kind, recordB );
	} );

	it( 'should return records filtered by name', () => {
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

	it( 'should return all records', () => {
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

	it( 'should return all longnames of stored records', () => {
		expect( collection.getAllLongnames() ).to.deep.equal(
			[
				'module:M~ClassA',
				'module:M~ClassA#methodB'
			]
		);
	} );
} );
