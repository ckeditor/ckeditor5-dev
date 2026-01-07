/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import isIssueOrPullRequestActive from '../../lib/utils/isissueorpullrequestactive.js';

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'isIssueOrPullRequestActive', () => {
		let issueBase, optionsBase, staleDate, afterStaleDate, beforeStaleDate;

		beforeEach( () => {
			issueBase = {
				createdAt: null,
				lastEditedAt: null,
				lastReactedAt: null,
				timelineItems: []
			};

			optionsBase = {
				ignoredActivityLogins: [],
				ignoredActivityLabels: []
			};

			staleDate = '2022-12-01T00:00:00Z';
			afterStaleDate = '2022-12-01T00:00:01Z';
			beforeStaleDate = '2022-11-30T23:59:59Z';
		} );

		it( 'should be a function', () => {
			expect( isIssueOrPullRequestActive ).toBeInstanceOf( Function );
		} );

		it( 'should return true for issue created after stale date', () => {
			const issue = {
				...issueBase,
				createdAt: afterStaleDate
			};

			expect( isIssueOrPullRequestActive( issue, staleDate, optionsBase ) ).toEqual( true );
		} );

		it( 'should return false for issue created before stale date', () => {
			const issue = {
				...issueBase,
				createdAt: beforeStaleDate
			};

			expect( isIssueOrPullRequestActive( issue, staleDate, optionsBase ) ).toEqual( false );
		} );

		it( 'should return true for issue edited after stale date', () => {
			const issue = {
				...issueBase,
				lastEditedAt: afterStaleDate
			};

			expect( isIssueOrPullRequestActive( issue, staleDate, optionsBase ) ).toEqual( true );
		} );

		it( 'should return false for issue edited before stale date', () => {
			const issue = {
				...issueBase,
				lastEditedAt: beforeStaleDate
			};

			expect( isIssueOrPullRequestActive( issue, staleDate, optionsBase ) ).toEqual( false );
		} );

		it( 'should return true for issue with reaction after stale date', () => {
			const issue = {
				...issueBase,
				lastReactedAt: afterStaleDate
			};

			expect( isIssueOrPullRequestActive( issue, staleDate, optionsBase ) ).toEqual( true );
		} );

		it( 'should return false for issue with reaction before stale date', () => {
			const issue = {
				...issueBase,
				lastReactedAt: beforeStaleDate
			};

			expect( isIssueOrPullRequestActive( issue, staleDate, optionsBase ) ).toEqual( false );
		} );

		it( 'should return true for issue with activity after stale date', () => {
			const issue = {
				...issueBase,
				timelineItems: [
					{ eventDate: beforeStaleDate },
					{ eventDate: afterStaleDate }
				]
			};

			expect( isIssueOrPullRequestActive( issue, staleDate, optionsBase ) ).toEqual( true );
		} );

		it( 'should return false for issue without activity after stale date', () => {
			const issue = {
				...issueBase,
				timelineItems: [
					{ eventDate: beforeStaleDate },
					{ eventDate: beforeStaleDate }
				]
			};

			expect( isIssueOrPullRequestActive( issue, staleDate, optionsBase ) ).toEqual( false );
		} );

		it( 'should return true for issue with activity after stale date and its author is not ignored', () => {
			const issue = {
				...issueBase,
				timelineItems: [
					{ eventDate: beforeStaleDate },
					{ eventDate: afterStaleDate, author: 'RandomUser' }
				]
			};

			const options = {
				...optionsBase,
				ignoredActivityLogins: [ 'CKEditorBot' ]
			};

			expect( isIssueOrPullRequestActive( issue, staleDate, options ) ).toEqual( true );
		} );

		it( 'should return false for issue with activity after stale date but its author is ignored', () => {
			const issue = {
				...issueBase,
				timelineItems: [
					{ eventDate: beforeStaleDate },
					{ eventDate: afterStaleDate, author: 'CKEditorBot' }
				]
			};

			const options = {
				...optionsBase,
				ignoredActivityLogins: [ 'CKEditorBot' ]
			};

			expect( isIssueOrPullRequestActive( issue, staleDate, options ) ).toEqual( false );
		} );

		it( 'should return true for issue with activity after stale date and label is not ignored', () => {
			const issue = {
				...issueBase,
				timelineItems: [
					{ eventDate: beforeStaleDate },
					{ eventDate: afterStaleDate, label: 'status:in-progress' }
				]
			};

			const options = {
				...optionsBase,
				ignoredActivityLabels: [ 'status:stale' ]
			};

			expect( isIssueOrPullRequestActive( issue, staleDate, options ) ).toEqual( true );
		} );

		it( 'should return false for issue with activity after stale date but label is ignored', () => {
			const issue = {
				...issueBase,
				timelineItems: [
					{ eventDate: beforeStaleDate },
					{ eventDate: afterStaleDate, label: 'status:stale' }
				]
			};

			const options = {
				...optionsBase,
				ignoredActivityLabels: [ 'status:stale' ]
			};

			expect( isIssueOrPullRequestActive( issue, staleDate, options ) ).toEqual( false );
		} );
	} );
} );
