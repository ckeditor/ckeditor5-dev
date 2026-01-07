/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import isIssueOrPullRequestToClose from '../../lib/utils/isissueorpullrequesttoclose.js';
import findStaleDate from '../../lib/utils/findstaledate.js';
import isIssueOrPullRequestActive from '../../lib/utils/isissueorpullrequestactive.js';

vi.mock( '../../lib/utils/findstaledate' );
vi.mock( '../../lib/utils/isissueorpullrequestactive' );

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'isIssueOrPullRequestToClose', () => {
		let staleDate, afterStaleDate, beforeStaleDate, issueBase, optionsBase;

		beforeEach( () => {
			staleDate = '2022-12-01T00:00:00Z';
			afterStaleDate = '2022-12-01T00:00:01Z';
			beforeStaleDate = '2022-11-30T23:59:59Z';

			issueBase = {};

			optionsBase = {
				closeDate: staleDate
			};

			vi.mocked( findStaleDate ).mockReturnValue( staleDate );
		} );

		it( 'should be a function', () => {
			expect( isIssueOrPullRequestToClose ).toBeInstanceOf( Function );
		} );

		it( 'should get the stale date from issue activity', () => {
			isIssueOrPullRequestToClose( issueBase, optionsBase );

			expect( vi.mocked( findStaleDate ) ).toHaveBeenCalledOnce();
			expect( vi.mocked( findStaleDate ) ).toHaveBeenCalledWith( issueBase, optionsBase );
		} );

		it( 'should not check issue activity if time to close has not passed', () => {
			optionsBase.closeDate = beforeStaleDate;

			isIssueOrPullRequestToClose( issueBase, optionsBase );

			expect( vi.mocked( isIssueOrPullRequestActive ) ).not.toHaveBeenCalled();
		} );

		it( 'should check issue activity if time to close has passed', () => {
			optionsBase.closeDate = afterStaleDate;

			isIssueOrPullRequestToClose( issueBase, optionsBase );

			expect( vi.mocked( isIssueOrPullRequestActive ) ).toHaveBeenCalledOnce();
			expect( vi.mocked( isIssueOrPullRequestActive ) ).toHaveBeenCalledWith( issueBase, staleDate, optionsBase );
		} );

		it( 'should return true if issue is not active after stale date and time to close has passed', () => {
			optionsBase.closeDate = afterStaleDate;
			vi.mocked( isIssueOrPullRequestActive ).mockReturnValue( false );

			expect( isIssueOrPullRequestToClose( issueBase, optionsBase ) ).toEqual( true );
		} );

		it( 'should return false if issue is not active after stale date and time to close has not passed', () => {
			optionsBase.closeDate = beforeStaleDate;
			vi.mocked( isIssueOrPullRequestActive ).mockReturnValue( false );

			expect( isIssueOrPullRequestToClose( issueBase, optionsBase ) ).toEqual( false );
		} );

		it( 'should return false if issue is active after stale date and time to close has passed', () => {
			optionsBase.closeDate = afterStaleDate;
			vi.mocked( isIssueOrPullRequestActive ).mockReturnValue( true );

			expect( isIssueOrPullRequestToClose( issueBase, optionsBase ) ).toEqual( false );
		} );

		it( 'should return false if issue is active after stale date and time to close has not passed', () => {
			optionsBase.closeDate = beforeStaleDate;
			vi.mocked( isIssueOrPullRequestActive ).mockReturnValue( true );

			expect( isIssueOrPullRequestToClose( issueBase, optionsBase ) ).toEqual( false );
		} );
	} );
} );
