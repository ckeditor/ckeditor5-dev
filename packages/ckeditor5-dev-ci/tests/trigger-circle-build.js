/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const triggerCircleBuild = require( '../lib/trigger-circle-build' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );

describe( 'lib/triggerCircleBuild', () => {
	let stubs;

	beforeEach( () => {
		stubs = {
			fetch: sinon.stub( global, 'fetch' )
		};
	} );

	afterEach( () => {
		sinon.restore();
	} );

	it( 'should send a POST request to the CircleCI service', async () => {
		stubs.fetch.resolves( {
			json: () => Promise.resolve( {
				error_message: null
			} )
		} );

		await triggerCircleBuild( {
			circleToken: 'circle-token',
			commit: 'abcd1234',
			branch: 'master',
			repositorySlug: 'ckeditor/ckeditor5-dev'
		} );

		expect( stubs.fetch.callCount ).to.equal( 1 );

		const [ url, options ] = stubs.fetch.firstCall.args;

		expect( url ).to.equal( 'https://circleci.com/api/v2/project/github/ckeditor/ckeditor5-dev/pipeline' );
		expect( options ).to.have.property( 'method', 'post' );
		expect( options ).to.have.property( 'headers' );
		expect( options.headers ).to.have.property( 'Circle-Token', 'circle-token' );
		expect( options ).to.have.property( 'body' );

		const body = JSON.parse( options.body );
		expect( body ).to.have.property( 'branch', 'master' );
		expect( body ).to.have.property( 'parameters' );
		expect( body.parameters ).to.have.property( 'triggerCommitHash', 'abcd1234' );
	} );

	it( 'should include the "isRelease=true" parameter when passing the `releaseBranch` option (the same release branch)', async () => {
		stubs.fetch.resolves( {
			json: () => Promise.resolve( {
				error_message: null
			} )
		} );

		await triggerCircleBuild( {
			circleToken: 'circle-token',
			commit: 'abcd1234',
			branch: 'master',
			repositorySlug: 'ckeditor/ckeditor5-dev',
			releaseBranch: 'master'
		} );

		expect( stubs.fetch.callCount ).to.equal( 1 );

		const [ , options ] = stubs.fetch.firstCall.args;

		expect( options ).to.have.property( 'body' );

		const body = JSON.parse( options.body );
		expect( body ).to.have.property( 'parameters' );
		expect( body.parameters ).to.have.property( 'isRelease', true );
	} );

	it( 'should include the "isRelease=false" parameter when passing the `releaseBranch` option', async () => {
		stubs.fetch.resolves( {
			json: () => Promise.resolve( {
				error_message: null
			} )
		} );

		await triggerCircleBuild( {
			circleToken: 'circle-token',
			commit: 'abcd1234',
			branch: 'master',
			repositorySlug: 'ckeditor/ckeditor5-dev',
			releaseBranch: 'release'
		} );

		expect( stubs.fetch.callCount ).to.equal( 1 );

		const [ , options ] = stubs.fetch.firstCall.args;

		expect( options ).to.have.property( 'body' );

		const body = JSON.parse( options.body );
		expect( body ).to.have.property( 'parameters' );
		expect( body.parameters ).to.have.property( 'isRelease', false );
	} );

	it( 'should include the "triggerRepositorySlug" parameter when passing the `releaseBranch` option', async () => {
		stubs.fetch.resolves( {
			json: () => Promise.resolve( {
				error_message: null
			} )
		} );

		await triggerCircleBuild( {
			circleToken: 'circle-token',
			commit: 'abcd1234',
			branch: 'master',
			repositorySlug: 'ckeditor/ckeditor5-dev',
			triggerRepositorySlug: 'ckeditor/ckeditor5'
		} );

		expect( stubs.fetch.callCount ).to.equal( 1 );

		const [ , options ] = stubs.fetch.firstCall.args;

		expect( options ).to.have.property( 'body' );

		const body = JSON.parse( options.body );
		expect( body ).to.have.property( 'parameters' );
		expect( body.parameters ).to.have.property( 'triggerRepositorySlug', 'ckeditor/ckeditor5' );
	} );

	it( 'should reject a promise when CircleCI responds with an error', async () => {
		stubs.fetch.resolves( {
			json: () => Promise.resolve( {
				error_message: 'HTTP 404'
			} )
		} );

		const data = {
			circleToken: 'circle-token',
			commit: 'abcd1234',
			branch: 'master',
			repositorySlug: 'ckeditor/ckeditor5-dev'
		};

		return triggerCircleBuild( data )
			.catch( err => {
				expect( err.message ).to.equal( 'CI trigger failed: "HTTP 404".' );
			} );
	} );
} );
