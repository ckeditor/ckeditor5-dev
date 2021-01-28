/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-env/release-tools/utils', () => {
	let displaySkippedPackages, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

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
			stubs.getPackageJson.onFirstCall().returns( { name: '@ckeditor/ckeditor5-foo' } );
			stubs.getPackageJson.onSecondCall().returns( { name: '@ckeditor/ckeditor5-bar' } );

			displaySkippedPackages( new Set( [
				'/packages/ckeditor5-foo',
				'/packages/ckeditor5-bar'
			] ) );

			expect( stubs.logger.info.calledOnce ).to.equal( true );

			const logMessage = stubs.logger.info.firstCall.args[ 0 ].split( '\n' );

			expect( logMessage[ 0 ].includes( 'Packages listed below have been skipped:' ) ).to.equal( true );
			expect( logMessage[ 1 ].includes( '  * @ckeditor/ckeditor5-foo' ) ).to.equal( true );
			expect( logMessage[ 2 ].includes( '  * @ckeditor/ckeditor5-bar' ) ).to.equal( true );
		} );

		it( 'does not display if given list is empty', () => {
			displaySkippedPackages( new Set() );
			expect( stubs.logger.info.calledOnce ).to.equal( false );
		} );
	} );
} );
