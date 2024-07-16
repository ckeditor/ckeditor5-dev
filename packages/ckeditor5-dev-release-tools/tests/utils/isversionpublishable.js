/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/isVersionPublishable', () => {
	let stub, isVersionPublishable;

	beforeEach( () => {
		stub = {
			semver: {
				lte: sinon.stub()
			},
			devUtils: {
				tools: {
					shExec: sinon.stub()
				}
			}
		};

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( 'semver', stub.semver );
		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', stub.devUtils );

		isVersionPublishable = require( '../../lib/utils/isversionpublishable' );
	} );

	afterEach( () => {
		mockery.deregisterAll();
		mockery.disable();
	} );

	it( 'should return true if given version is available', async () => {
		stub.semver.lte.returns( false );
		stub.devUtils.tools.shExec.resolves( '1.0.0\n' );

		const result = await isVersionPublishable( 'package-name', '1.0.1', 'latest' );

		expect( result ).to.equal( true );
		expect( stub.semver.lte.callCount ).to.equal( 1 );
		expect( stub.semver.lte.firstCall.args ).to.deep.equal( [ '1.0.1', '1.0.0' ] );
		expect( stub.devUtils.tools.shExec.callCount ).to.equal( 1 );
		expect( stub.devUtils.tools.shExec.firstCall.firstArg ).to.equal( 'npm view package-name@latest version --silent' );
	} );

	it( 'should return false if given version is not available', async () => {
		stub.semver.lte.returns( true );
		stub.devUtils.tools.shExec.resolves( '1.0.0\n' );

		const result = await isVersionPublishable( 'package-name', '1.0.0', 'latest' );

		expect( result ).to.equal( false );
		expect( stub.semver.lte.callCount ).to.equal( 1 );
		expect( stub.semver.lte.firstCall.args ).to.deep.equal( [ '1.0.0', '1.0.0' ] );
		expect( stub.devUtils.tools.shExec.callCount ).to.equal( 1 );
		expect( stub.devUtils.tools.shExec.firstCall.firstArg ).to.equal( 'npm view package-name@latest version --silent' );
	} );

	it( 'should return true if given npm tag is not published yet', async () => {
		stub.devUtils.tools.shExec.rejects( 'E404' );

		const result = await isVersionPublishable( 'package-name', '1.0.0', 'alpha' );

		expect( result ).to.equal( true );
		expect( stub.semver.lte.callCount ).to.equal( 0 );
		expect( stub.devUtils.tools.shExec.callCount ).to.equal( 1 );
		expect( stub.devUtils.tools.shExec.firstCall.firstArg ).to.equal( 'npm view package-name@alpha version --silent' );
	} );
} );
