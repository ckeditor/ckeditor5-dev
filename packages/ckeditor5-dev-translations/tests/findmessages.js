/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import traverse from '@babel/traverse';

describe( 'findMessages', () => {
	let findMessages;

	beforeEach( async () => {
		findMessages = ( await import( '../lib/findmessages.js' ) ).default;
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

	it( 'should parse provided TypeScript code and find messages from `t()` function calls on string literals', () => {
		const messages = [];

		findMessages(
			`function x( param: string ): void {
                const t = this.t;
                t( 'Image' );
                t( { string: 'CKEditor', ID: 'CKEDITOR' } );
                t( { string: 'Image', plural: 'Images' } );
                t( { string: 'Image', plural: 'Images', id: 'AN_IMAGE' } );
                g( 'Some other function' );
			}`,
			'foo.ts',
			message => messages.push( message )
		);

		expect( messages ).to.deep.equal( [
			{ id: 'Image', string: 'Image' },
			{ id: 'CKEditor', string: 'CKEditor' },
			{ id: 'Image', plural: 'Images', string: 'Image' },
			{ id: 'AN_IMAGE', plural: 'Images', string: 'Image' }
		] );
	} );

	it( 'should not throw an error when defining a type after an instantiation expression', () => {
		const errors = [];
		const messages = [];

		findMessages(
			`function addEventListener<TEvent extends BaseEvent>(
				listener: Emitter,
				emitter: Emitter,
				event: TEvent[ 'name' ],
				callback: GetCallback<TEvent>,
				options: CallbackOptions
			) {
				( listener._addEventListener<TEvent> ) .call( emitter, event, callback, options );
			}`,
			'emitter.ts',
			message => messages.push( message ),
			error => errors.push( error )
		);

		expect( messages.length ).to.equal( 0 );
		expect( errors.length ).to.equal( 0 );
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

	it( 'should parse provided code and find messages inside the `t()` function calls on objects with stringified properties', () => {
		const messages = [];

		findMessages(
			`function x() {
                const t = this.t;
                t( { 'string': 'Image' } );
                t( { 'string': 'Image', 'id': 'AN_IMAGE' } );
                t( { 'string': 'Image', 'plural': 'Images' } );
                t( { 'string': 'Image', 'plural': 'Images', 'id': 'AN_IMAGE' } );
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

	it( 'should parse provided code and find messages inside the `t()` function calls on simple conditional expressions', () => {
		const messages = [];

		findMessages(
			`function x() {
                const t = this.t;
                t( x ? 'foo1' : 'bar1' );
                t( x ? 'foo2' : { 'string': 'bar2' } );
                t( x ? { string: 'Image', id: 'AN_IMAGE' } : { 'string': 'space', 'plural': '%0 spaces', 'id': 'SPACE' } );
			}`,
			'foo.js',
			message => messages.push( message )
		);

		expect( messages ).to.deep.equal( [
			{ id: 'foo1', string: 'foo1' },
			{ id: 'bar1', string: 'bar1' },

			{ id: 'foo2', string: 'foo2' },
			{ id: 'bar2', string: 'bar2' },

			{ id: 'AN_IMAGE', string: 'Image' },
			{ id: 'SPACE', string: 'space', plural: '%0 spaces' }
		] );
	} );

	it( 'should omit invalid t() calls', () => {
		const messages = [];
		const errors = [];

		findMessages(
			`function x() {
				t( {} );
                t( { bar: {} } );
			}`,
			'foo.js',
			message => messages.push( message ),
			error => errors.push( error )
		);

		expect( messages ).to.have.length( 0 );
		expect( errors ).to.have.length( 2 );
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

	describe( 'a non-type=module project support', () => {
		beforeEach( async () => {
			vi.resetAllMocks();
			vi.clearAllMocks();
			vi.resetModules();

			vi.doMock( '@babel/traverse', () => ( {
				default: {
					default: traverse
				}
			} ) );

			findMessages = ( await import( '../lib/findmessages.js' ) ).default;
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
	} );
} );
