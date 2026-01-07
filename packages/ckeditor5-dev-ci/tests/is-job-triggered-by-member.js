/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import isJobTriggeredByMember from '../lib/is-job-triggered-by-member.js';
import getJobApprover from '../lib/utils/get-job-approver.js';

const {
	octokitRequestMock,
	octokitConstructorSpy
} = vi.hoisted( () => {
	return {
		octokitRequestMock: vi.fn(),
		octokitConstructorSpy: vi.fn()
	};
} );

vi.mock( '../lib/utils/get-job-approver' );

vi.mock( '@octokit/rest', () => {
	return {
		Octokit: class {
			constructor( ...args ) {
				octokitConstructorSpy( ...args );

				this.request = octokitRequestMock;
			}
		}
	};
} );

describe( 'lib/isJobTriggeredByMember', () => {
	it( 'should pass given parameters to services', async () => {
		vi.mocked( getJobApprover ).mockResolvedValue( 'foo' );
		vi.mocked( octokitRequestMock ).mockResolvedValue( { data: [] } );

		await isJobTriggeredByMember( {
			circleToken: 'circle-token',
			circleWorkflowId: 'abc-123-abc-456',
			circleApprovalJobName: 'approval-job',
			githubOrganization: 'ckeditor',
			githubTeamSlug: 'team-slug',
			githubToken: 'github-token'
		} );

		expect( vi.mocked( octokitConstructorSpy ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( octokitConstructorSpy ) ).toHaveBeenCalledWith( {
			'auth': 'github-token'
		} );

		expect( vi.mocked( getJobApprover ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( getJobApprover ) ).toHaveBeenCalledWith(
			'circle-token',
			'abc-123-abc-456',
			'approval-job'
		);

		expect( vi.mocked( octokitRequestMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( octokitRequestMock ) ).toHaveBeenCalledWith(
			'GET /orgs/{org}/teams/{team_slug}/members',
			{
				'org': 'ckeditor',
				'team_slug': 'team-slug',
				'headers': {
					'X-GitHub-Api-Version': '2022-11-28'
				}
			}
		);
	} );

	it( 'should resolves true when a team member is allowed to trigger the given job', async () => {
		// Who triggered.
		vi.mocked( getJobApprover ).mockResolvedValue( 'foo' );

		// Who is allowed to trigger.
		vi.mocked( octokitRequestMock ).mockResolvedValue( { data: [
			{ login: 'foo' },
			{ login: 'bar' }
		] } );

		const result = await isJobTriggeredByMember( {
			circleToken: 'circle-token',
			circleWorkflowId: 'abc-123-abc-456',
			circleApprovalJobName: 'approval-job',
			githubOrganization: 'ckeditor',
			githubTeamSlug: 'team-slug',
			githubToken: 'github-token'
		} );

		expect( result ).toEqual( true );
	} );

	it( 'should resolves false when a team member is not allowed to trigger the given job', async () => {
		// Who triggered.
		vi.mocked( getJobApprover ).mockResolvedValue( 'foo' );

		// Who is allowed to trigger.
		vi.mocked( octokitRequestMock ).mockResolvedValue( { data: [
			{ login: 'bar' }
		] } );

		const result = await isJobTriggeredByMember( {
			circleToken: 'circle-token',
			circleWorkflowId: 'abc-123-abc-456',
			circleApprovalJobName: 'approval-job',
			githubOrganization: 'ckeditor',
			githubTeamSlug: 'team-slug',
			githubToken: 'github-token'
		} );

		expect( result ).toEqual( false );
	} );
} );
