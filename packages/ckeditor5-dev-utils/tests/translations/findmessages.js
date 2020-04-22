/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const findMessages = require( '../../lib/translations/findmessages' );

describe( 'findMessages', () => {
	const sandbox = sinon.createSandbox();

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'should parse provided code and find messages from `t()` function calls on string literals', () => {
		const messages = [];

		findMessages(
			`function x() {
                const t = this.t;
                t( 'Image' );
                t( 'CKEditor' );
                g( 'Some other function' );
			}`,
			'foo.js',
			message => messages.push( message )
		);

		expect( messages ).to.deep.equal( [ { id: 'Image', string: 'Image' }, { id: 'CKEditor', string: 'CKEditor' } ] );
	} );

	it( 'should parse provided code and find messages inside the `t()` function calls on object literals', () => {
		const messages = [];

		findMessages(
			`function x() {
                const t = this.t;
                t( { string: 'Image' } );
                t( { string: 'Image', id: 'AN_IMAGE' } );
                t( { string: 'Image', plural: 'Images' } );
                t( { string: 'Image', plural: 'Images', id: 'AN_IMAGE' } );
			}`,
			'foo.js',
			message => messages.push( message )
		);

		expect( messages ).to.deep.equal( [
			{ id: 'Image', string: 'Image' },
			{ id: 'AN_IMAGE', string: 'Image' },
			{ id: 'Image', string: 'Image', plural: 'Images' },
			{ id: 'AN_IMAGE', string: 'Image', plural: 'Images' }
		] );
	} );

	it( 'should log warnings for method `t` calls', () => {
		const messages = [];
		const errors = [];

		findMessages(
			`function x() {
				foo.bar( 'baz' );
                editor.t( 'First call' );
                this.t( 'Second call' );
                locale.t( 'Second call' );
			}`,
			'foo.js',
			message => messages.push( message ),
			error => errors.push( error )
		);

		expect( messages ).to.deep.equal( [] );
		expect( errors ).to.have.length( 2 );

		expect( errors ).to.deep.equal( [
			'Found \'editor.t()\' in the foo.js. ' +
			'Only messages from direct \'t()\' calls will be handled by CKEditor 5 translation mechanisms.',
			'Found \'locale.t()\' in the foo.js. ' +
			'Only messages from direct \'t()\' calls will be handled by CKEditor 5 translation mechanisms.'
		] );
	} );

	it( 'should log warnings when the t call argument is not a string literal or an object literal', () => {
		const messages = [];
		const errors = [];

		findMessages(
			`function x() {
				const t = this.t;
                const Image = 'Image';
                t( Image );
			}`,
			'foo.js',
			message => messages.push( message ),
			error => errors.push( error )
		);

		expect( errors ).to.deep.equal( [
			'First t() call argument should be a string literal or an object literal (foo.js).'
		] );
	} );
} );
