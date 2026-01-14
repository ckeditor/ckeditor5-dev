/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import findStaleDate from '../../lib/utils/findstaledate.js';
import isIssueOrPullRequestActive from '../../lib/utils/isissueorpullrequestactive.js';
import isIssueOrPullRequestToUnstale from '../../lib/utils/isissueorpullrequesttounstale.js';

vi.mock( '../../lib/utils/findstaledate' );
vi.mock( '../../lib/utils/isissueorpullrequestactive' );

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'isIssueOrPullRequestToUnstale', () => {
		let staleDate, issueBase, optionsBase;

		beforeEach( () => {
			staleDate = '2022-12-01T00:00:00Z';

			issueBase = {};

			optionsBase = {};

			vi.mocked( findStaleDate ).mockReturnValue( staleDate );
		} );

		it( 'should be a function', () => {
			expect( isIssueOrPullRequestToUnstale ).toBeInstanceOf( Function );
		} );

		it( 'should get the stale date from issue activity', () => {
			isIssueOrPullRequestToUnstale( issueBase, optionsBase );

			expect( vi.mocked( findStaleDate ) ).toHaveBeenCalledOnce();
			expect( vi.mocked( findStaleDate ) ).toHaveBeenCalledWith( issueBase, optionsBase );
		} );

		it( 'should check issue activity', () => {
			isIssueOrPullRequestToUnstale( issueBase, optionsBase );

			expect( vi.mocked( isIssueOrPullRequestActive ) ).toHaveBeenCalledOnce();
			expect( vi.mocked( isIssueOrPullRequestActive ) ).toHaveBeenCalledWith( issueBase, staleDate, optionsBase );
		} );

		it( 'should return true if issue is active after stale date', () => {
			vi.mocked( isIssueOrPullRequestActive ).mockReturnValue( true );

			expect( isIssueOrPullRequestToUnstale( issueBase, optionsBase ) ).toEqual( true );
		} );

		it( 'should return false if issue is active after stale date', () => {
			vi.mocked( isIssueOrPullRequestActive ).mockReturnValue( false );

			expect( isIssueOrPullRequestToUnstale( issueBase, optionsBase ) ).toEqual( false );
		} );
	} );
} );
