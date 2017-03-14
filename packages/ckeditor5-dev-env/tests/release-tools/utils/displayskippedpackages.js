/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-env/release-tools/utils', () => {
	let displaySkippedPackages, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		stubs = {
			logger: {
				info: sandbox.stub(),
				warning: sandbox.stub(),
				error: sandbox.stub()
			}
		};
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'displaySkippedPackages()', () => {
		beforeEach( () => {
			displaySkippedPackages = proxyquire( '../../../lib/release-tools/utils/displayskippedpackages', {
				'@ckeditor/ckeditor5-dev-utils': {
					logger() {
						return stubs.logger;
					}
				}
			} );
		} );

		it( 'returns true if a commit was made until the last tag', () => {
			const logMessage = [
				'Packages listed below have been skipped:',
				'  * @ckeditor/ckeditor5-foo',
				'  * @ckeditor/ckeditor5-bar'
			].join( '\n' );

			displaySkippedPackages( [
				'@ckeditor/ckeditor5-foo',
				'@ckeditor/ckeditor5-bar'
			] );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.equal( logMessage );
		} );

		it( 'does not display if given argument is not an array', () => {
			displaySkippedPackages( null );
			expect( stubs.logger.info.calledOnce ).to.equal( false );
		} );

		it( 'does not display if given list is empty', () => {
			displaySkippedPackages( [] );
			expect( stubs.logger.info.calledOnce ).to.equal( false );
		} );
	} );
} );
