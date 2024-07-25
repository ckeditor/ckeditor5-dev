/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/getNpmTagFromVersion', () => {
	let stub, getNpmTagFromVersion;

	beforeEach( () => {
		stub = {
			semver: {
				prerelease: sinon.stub()
			}
		};

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( 'semver', stub.semver );

		getNpmTagFromVersion = require( '../../lib/utils/getnpmtagfromversion' );
	} );

	afterEach( () => {
		mockery.deregisterAll();
		mockery.disable();
	} );

	it( 'should return "latest" when processing a X.Y.Z version', () => {
		expect( getNpmTagFromVersion( '1.0.0' ) ).to.equal( 'latest' );
		expect( getNpmTagFromVersion( '2.1.0' ) ).to.equal( 'latest' );
		expect( getNpmTagFromVersion( '3.2.1' ) ).to.equal( 'latest' );
	} );

	it( 'should return "alpha" when processing a X.Y.Z-alpha.X version', () => {
		stub.semver.prerelease.returns( [ 'alpha', 0 ] );

		expect( getNpmTagFromVersion( '1.0.0-alpha.0' ) ).to.equal( 'alpha' );
		expect( getNpmTagFromVersion( '2.1.0-alpha.0' ) ).to.equal( 'alpha' );
		expect( getNpmTagFromVersion( '3.2.1-alpha.0' ) ).to.equal( 'alpha' );
	} );
} );
