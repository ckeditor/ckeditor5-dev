/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

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
			},
			getPackageJson: sandbox.stub()
		};

		displaySkippedPackages = proxyquire( '../../../lib/release-tools/utils/displayskippedpackages', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger() {
					return stubs.logger;
				}
			},
			'./getpackagejson': stubs.getPackageJson
		} );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'displaySkippedPackages()', () => {
		it( 'displays name of packages that have been skipped', () => {
			const logMessage = [
				'Packages listed below have been skipped:',
				'  * @ckeditor/ckeditor5-foo',
				'  * @ckeditor/ckeditor5-bar'
			].join( '\n' );

			stubs.getPackageJson.onFirstCall().returns( { name: '@ckeditor/ckeditor5-foo' } );
			stubs.getPackageJson.onSecondCall().returns( { name: '@ckeditor/ckeditor5-bar' } );

			displaySkippedPackages( new Set( [
				'/packages/ckeditor5-foo',
				'/packages/ckeditor5-bar'
			] ) );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.equal( logMessage );
		} );

		it( 'does not display if given list is empty', () => {
			displaySkippedPackages( new Set() );
			expect( stubs.logger.info.calledOnce ).to.equal( false );
		} );
	} );
} );
