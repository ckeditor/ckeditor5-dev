/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const getJobApprover = require( '../../lib/utils/get-job-approver' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );

describe( 'lib/utils/getJobApprover', () => {
	let stubs;

	beforeEach( () => {
		stubs = {
			fetch: sinon.stub( global, 'fetch' )
		};
	} );

	afterEach( () => {
		sinon.restore();
	} );

	it( 'should return a GitHub login name of a user who approved a job in given workflow', async () => {
		stubs.fetch.onCall( 0 ).resolves( {
			json: () => Promise.resolve( {
				items: [
					{ name: 'job-1' },
					{ name: 'job-2', approved_by: 'foo-unique-id' }
				]
			} )
		} );

		stubs.fetch.onCall( 1 ).resolves( {
			json: () => Promise.resolve( {
				login: 'foo'
			} )
		} );

		const login = await getJobApprover( 'circle-token', 'abc-123-abc-456', 'job-2' );

		expect( login ).to.equal( 'foo' );

		expect( stubs.fetch.callCount ).to.equal( 2 );

		const [ firstUrl, firstOptions ] = stubs.fetch.firstCall.args;

		expect( firstUrl ).to.equal( 'https://circleci.com/api/v2/workflow/abc-123-abc-456/job' );
		expect( firstOptions ).to.have.property( 'method', 'get' );
		expect( firstOptions ).to.have.property( 'headers' );
		expect( firstOptions.headers ).to.have.property( 'Circle-Token', 'circle-token' );

		const [ secondUrl, secondOptions ] = stubs.fetch.getCall( 1 ).args;

		expect( secondUrl ).to.equal( 'https://circleci.com/api/v2/user/foo-unique-id' );
		expect( secondOptions ).to.have.property( 'method', 'get' );
		expect( secondOptions ).to.have.property( 'headers' );
		expect( secondOptions.headers ).to.have.property( 'Circle-Token', 'circle-token' );
	} );
} );
