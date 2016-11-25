/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const sinon = require( 'sinon' );
const chai = require( 'chai' );
const expect = chai.expect;
const proxyquire = require( 'proxyquire' );

describe( 'Notifier Plugin', () => {
	let sandbox, plugin, infoSpy, warningSpy, errorSpy;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		const NotifierPlugin = proxyquire( '../lib/notifier-plugin', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger() {
					infoSpy = sinon.spy();
					warningSpy = sinon.spy();
					errorSpy = sinon.spy();

					return {
						info: infoSpy,
						warning: warningSpy,
						error: errorSpy
					};
				}
			}
		} );

		plugin = new NotifierPlugin();
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'has a logger', () => {
		expect( plugin.log ).to.have.property( 'info' );
		expect( plugin.log ).to.have.property( 'warning' );
		expect( plugin.log ).to.have.property( 'error' );
	} );

	describe( 'apply', () => {
		let compiler, compilerEvents;

		beforeEach( () => {
			compilerEvents = {};
			compiler = {
				plugin( event, handler ) {
					compilerEvents[ event ] = handler;
				}
			};
		} );

		it( 'logs when Webpack starts work', () => {
			plugin.apply( compiler );

			expect( compilerEvents ).to.have.property( 'compile' );

			compilerEvents.compile();

			expect( infoSpy.calledOnce ).to.equal( true );
			expect( infoSpy.firstCall.args[ 0 ] ).to.equal( '[Webpack] Starting scripts compilation...' );
		} );

		it( 'logs when Webpack finishes work without errors', () => {
			plugin.apply( compiler );

			expect( compilerEvents ).to.have.property( 'done' );

			compilerEvents.done( {
				compilation: {
					errors: [],
					warnings: []
				}
			} );

			expect( warningSpy.called ).to.equal( false );
			expect( errorSpy.called ).to.equal( false );
			expect( infoSpy.calledOnce ).to.equal( true );
			expect( infoSpy.firstCall.args[ 0 ] ).to.equal( '[Webpack] Finished the compilation.' );
		} );

		it( 'logs contains warning and errors when Webpack finishes work with problems', () => {
			plugin.apply( compiler );

			expect( compilerEvents ).to.have.property( 'done' );

			compilerEvents.done( {
				compilation: {
					errors: [
						new Error( 'Error message.' )
					],
					warnings: [
						new Error( 'Warning message.' )
					]
				}
			} );

			expect( warningSpy.calledOnce ).to.equal( true );
			expect( warningSpy.firstCall.args[ 0 ] ).to.equal( 'Warning message.' );
			expect( errorSpy.calledOnce ).to.equal( true );
			expect( errorSpy.firstCall.args[ 0 ] ).to.equal( 'Error message.' );
			expect( infoSpy.calledOnce ).to.equal( true );
			expect( infoSpy.firstCall.args[ 0 ] ).to.equal( '[Webpack] Finished the compilation.' );
		} );
	} );
} );

