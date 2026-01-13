/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import isPendingIssueToStale from '../../lib/utils/ispendingissuetostale.js';
import isPendingIssueStale from '../../lib/utils/ispendingissuestale.js';

vi.mock( '../../lib/utils/ispendingissuestale' );

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'isPendingIssueToStale', () => {
		let issueBase, optionsBase, staleDatePendingIssue, afterStaleDatePendingIssue, beforeStaleDatePendingIssue;

		beforeEach( () => {
			staleDatePendingIssue = '2022-12-01T00:00:00Z';
			afterStaleDatePendingIssue = '2022-12-01T00:00:01Z';
			beforeStaleDatePendingIssue = '2022-11-30T23:59:59Z';

			issueBase = {
				lastComment: null
			};

			optionsBase = {
				staleDatePendingIssue
			};
		} );

		it( 'should be a function', () => {
			expect( isPendingIssueToStale ).toBeInstanceOf( Function );
		} );

		it( 'should check if issue is stale', () => {
			isPendingIssueToStale( issueBase, optionsBase );

			expect( vi.mocked( isPendingIssueStale ) ).toHaveBeenCalledOnce();
			expect( vi.mocked( isPendingIssueStale ) ).toHaveBeenCalledWith( issueBase, optionsBase );
		} );

		it( 'should return false if issue is already stale', () => {
			vi.mocked( isPendingIssueStale ).mockReturnValue( true );

			expect( isPendingIssueToStale( issueBase, optionsBase ) ).toEqual( false );
		} );

		it( 'should return false if issue does not have any comment', () => {
			vi.mocked( isPendingIssueStale ).mockReturnValue( false );

			expect( isPendingIssueToStale( issueBase, optionsBase ) ).toEqual( false );
		} );

		it( 'should return false if last comment was created by a community member', () => {
			vi.mocked( isPendingIssueStale ).mockReturnValue( false );
			issueBase.lastComment = {
				isExternal: true
			};

			expect( isPendingIssueToStale( issueBase, optionsBase ) ).toEqual( false );
		} );

		it( 'should return false if last comment was created by a team member and time to stale has not passed', () => {
			vi.mocked( isPendingIssueStale ).mockReturnValue( false );
			issueBase.lastComment = {
				isExternal: false,
				createdAt: afterStaleDatePendingIssue
			};

			expect( isPendingIssueToStale( issueBase, optionsBase ) ).toEqual( false );
		} );

		it( 'should return true if last comment was created by a team member and time to stale has passed', () => {
			vi.mocked( isPendingIssueStale ).mockReturnValue( false );
			issueBase.lastComment = {
				isExternal: false,
				createdAt: beforeStaleDatePendingIssue
			};

			expect( isPendingIssueToStale( issueBase, optionsBase ) ).toEqual( true );
		} );
	} );
} );
