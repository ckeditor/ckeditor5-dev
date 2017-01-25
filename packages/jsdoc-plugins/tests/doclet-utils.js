/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

/* jshint mocha:true */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const { doesFieldExistInClass } = require( '../lib/utils/doclet-utils' );

describe( 'doclet-utils', () => {
	describe( 'doesFieldExistsInClass()', () => {
		it( 'should find method in the same class', () => {
			const result = doesFieldExistInClass( [ {
				longname: 'module:a~A#method',
			}, {
				longname: 'module:a~A'
			} ], 'module:a~A#method' );

			expect( result ).to.be.equal( true );
		} );

		it( 'should find method in the augmented class', () => {
			const result = doesFieldExistInClass( [ {
				longname: 'module:a~B#method',
			}, {
				longname: 'module:a~A',
				augments: [ 'module:a~B' ],
			}, {
				longname: 'module:a~B',
			} ], 'module:a~A#method' );

			expect( result ).to.be.equal( true );
		} );

		it( 'should not find method if not exists', () => {
			const result = doesFieldExistInClass( [ {
				longname: 'module:a~A#methodB',
			}, {
				longname: 'module:a~A'
			} ], 'module:a~A#methodA' );

			expect( result ).to.be.equal( false );
		} );
	} );
} );
