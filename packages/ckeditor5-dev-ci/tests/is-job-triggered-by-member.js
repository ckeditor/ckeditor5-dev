/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const proxyquire = require( 'proxyquire' );

describe( 'lib/isJobTriggeredByMember', () => {
	let stubs, isJobTriggeredByMember;

	beforeEach( () => {
		stubs = {
			fetch: sinon.stub( global, 'fetch' ),
			getJobApprover: sinon.stub(),
			octokitRestInstance: {
				request: sinon.stub()
			},
			octokitRest: sinon.stub().callsFake( () => stubs.octokitRestInstance )
		};

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( '@octokit/rest', { Octokit: stubs.octokitRest } );

		isJobTriggeredByMember = proxyquire( '../lib/is-job-triggered-by-member', {
			'./utils/get-job-approver': stubs.getJobApprover
		} );
	} );

	afterEach( () => {
		mockery.disable();
		sinon.restore();
	} );

	it( 'should pass given parameters to services', async () => {
		stubs.getJobApprover.resolves( 'foo' );
		stubs.octokitRestInstance.request.resolves( { data: [] } );

		await isJobTriggeredByMember( {
			circleToken: 'circle-token',
			circleWorkflowId: 'abc-123-abc-456',
			circleApprovalJobName: 'approval-job',
			githubOrganization: 'ckeditor',
			githubTeamSlug: 'team-slug',
			githubToken: 'github-token'
		} );

		expect( stubs.octokitRest.callCount ).to.equal( 1 );
		expect( stubs.octokitRest.firstCall.firstArg ).to.have.property( 'auth', 'github-token' );

		expect( stubs.getJobApprover.callCount ).to.equal( 1 );
		expect( stubs.getJobApprover.firstCall.args ).to.deep.equal( [
			'circle-token',
			'abc-123-abc-456',
			'approval-job'
		] );

		expect( stubs.octokitRestInstance.request.callCount ).to.equal( 1 );

		const [ url, data ] = stubs.octokitRestInstance.request.firstCall.args;

		expect( url ).to.equal( 'GET /orgs/{org}/teams/{team_slug}/members' );
		expect( data ).to.have.property( 'org', 'ckeditor' );
		expect( data ).to.have.property( 'team_slug', 'team-slug' );
		expect( data ).to.have.property( 'headers' );
		expect( data.headers ).to.have.property( 'X-GitHub-Api-Version', '2022-11-28' );
	} );

	it( 'should resolves true when a team member is allowed to trigger the given job', async () => {
		// Who triggered.
		stubs.getJobApprover.resolves( 'foo' );

		// Who is allowed to trigger.
		stubs.octokitRestInstance.request.resolves( {
			data: [
				{ login: 'foo' },
				{ login: 'bar' }
			]
		} );

		const result = await isJobTriggeredByMember( {
			circleToken: 'circle-token',
			circleWorkflowId: 'abc-123-abc-456',
			circleApprovalJobName: 'approval-job',
			githubOrganization: 'ckeditor',
			githubTeamSlug: 'team-slug',
			githubToken: 'github-token'
		} );

		expect( result ).to.equal( true );
	} );

	it( 'should resolves false when a team member is not allowed to trigger the given job', async () => {
		// Who triggered.
		stubs.getJobApprover.resolves( 'foo' );

		// Who is allowed to trigger.
		stubs.octokitRestInstance.request.resolves( {
			data: [
				{ login: 'bar' }
			]
		} );

		const result = await isJobTriggeredByMember( {
			circleToken: 'circle-token',
			circleWorkflowId: 'abc-123-abc-456',
			circleApprovalJobName: 'approval-job',
			githubOrganization: 'ckeditor',
			githubTeamSlug: 'team-slug',
			githubToken: 'github-token'
		} );

		expect( result ).to.equal( false );
	} );
} );
