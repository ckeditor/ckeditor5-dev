/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'lib/circleUpdateAutoCancelBuilds', () => {
	let stubs, circleUpdateAutoCancelBuilds;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			fetch: sinon.stub()
		};

		mockery.registerMock( 'node-fetch', stubs.fetch );

		circleUpdateAutoCancelBuilds = require( '../lib/circle-update-auto-cancel-builds' );
	} );

	afterEach( () => {
		mockery.disable();
	} );

	it( 'should send a request to CircleCI to update the redundant workflows option', async () => {
		const response = {};

		stubs.fetch.resolves( {
			json: () => Promise.resolve( response )
		} );

		const results = await circleUpdateAutoCancelBuilds( {
			circleToken: 'circle-token',
			githubOrganization: 'ckeditor',
			githubRepository: 'ckeditor5-foo',
			newValue: true
		} );

		expect( stubs.fetch.callCount ).to.equal( 1 );
		expect( results ).to.deep.equal( response );

		const [ url, options ] = stubs.fetch.firstCall.args;

		expect( url ).to.equal( 'https://circleci.com/api/v2/project/github/ckeditor/ckeditor5-foo/settings' );
		expect( options ).to.have.property( 'method', 'patch' );
		expect( options ).to.have.property( 'headers' );
		expect( options.headers ).to.have.property( 'Circle-Token', 'circle-token' );
		expect( options ).to.have.property( 'body' );

		const body = JSON.parse( options.body );
		expect( body ).to.have.property( 'advanced' );
		expect( body.advanced ).to.have.property( 'autocancel_builds', true );
	} );
} );
