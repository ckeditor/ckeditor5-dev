/**
 * @license Copyright (c) 2003-2022, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;

describe( 'dev-env/translations/utils', () => {
	let utils;

	beforeEach( () => {
		utils = require( '../../lib/translations/utils' );
	} );

	describe( 'verifyProperties()', () => {
		it( 'should throw an error if the specified property is not specified in an object', () => {
			expect( () => {
				utils.verifyProperties( {}, [ 'foo' ] );
			} ).to.throw( Error, 'The specified object misses the following properties: foo.' );
		} );

		it( 'should throw an error if the value of the property is `undefined`', () => {
			expect( () => {
				utils.verifyProperties( { foo: undefined }, [ 'foo' ] );
			} ).to.throw( Error, 'The specified object misses the following properties: foo.' );
		} );

		it( 'should throw an error containing all The specified object misses the following properties', () => {
			expect( () => {
				utils.verifyProperties( { foo: true, bar: 0 }, [ 'foo', 'bar', 'baz', 'xxx' ] );
			} ).to.throw( Error, 'The specified object misses the following properties: baz, xxx.' );
		} );

		it( 'should not throw an error if the value of the property is `null`', () => {
			expect( () => {
				utils.verifyProperties( { foo: null }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a boolean (`false`)', () => {
			expect( () => {
				utils.verifyProperties( { foo: false }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a boolean (`true`)', () => {
			expect( () => {
				utils.verifyProperties( { foo: true }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a number', () => {
			expect( () => {
				utils.verifyProperties( { foo: 1 }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a number (falsy value)', () => {
			expect( () => {
				utils.verifyProperties( { foo: 0 }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a NaN', () => {
			expect( () => {
				utils.verifyProperties( { foo: NaN }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a non-empty string', () => {
			expect( () => {
				utils.verifyProperties( { foo: 'foo' }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is an empty string', () => {
			expect( () => {
				utils.verifyProperties( { foo: '' }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is an array', () => {
			expect( () => {
				utils.verifyProperties( { foo: [] }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is an object', () => {
			expect( () => {
				utils.verifyProperties( { foo: {} }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a function', () => {
			expect( () => {
				utils.verifyProperties( {
					foo: () => {}
				}, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );
	} );
} );
