/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import isIssueOrPullRequestActive from '../../lib/utils/isissueorpullrequestactive.js';
import isIssueOrPullRequestToStale from '../../lib/utils/isissueorpullrequesttostale.js';

vi.mock( '../../lib/utils/isissueorpullrequestactive' );

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'isIssueOrPullRequestToStale', () => {
		let staleDate, issueBase, optionsBase;

		beforeEach( () => {
			staleDate = '2022-12-01T00:00:00Z';

			issueBase = {};

			optionsBase = {
				staleDate
			};
		} );

		it( 'should be a function', () => {
			expect( isIssueOrPullRequestToStale ).toBeInstanceOf( Function );
		} );

		it( 'should check issue activity', () => {
			isIssueOrPullRequestToStale( issueBase, optionsBase );

			expect( vi.mocked( isIssueOrPullRequestActive ) ).toHaveBeenCalledOnce();
			expect( vi.mocked( isIssueOrPullRequestActive ) ).toHaveBeenLastCalledWith( issueBase, staleDate, optionsBase );
		} );

		it( 'should return true if issue is not active after stale date', () => {
			vi.mocked( isIssueOrPullRequestActive ).mockReturnValue( false );

			expect( isIssueOrPullRequestToStale( issueBase, optionsBase ) ).toEqual( true );
		} );

		it( 'should return false if issue is active after stale date', () => {
			vi.mocked( isIssueOrPullRequestActive ).mockReturnValue( true );

			expect( isIssueOrPullRequestToStale( issueBase, optionsBase ) ).toEqual( false );
		} );
	} );
} );
