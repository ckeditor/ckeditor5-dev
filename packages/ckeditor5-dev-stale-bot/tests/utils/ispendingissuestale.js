/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import isPendingIssueStale from '../../lib/utils/ispendingissuestale.js';

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'isPendingIssueStale', () => {
		it( 'should be a function', () => {
			expect( isPendingIssueStale ).toBeInstanceOf( Function );
		} );

		it( 'should return false if issue does not have any label', () => {
			const issue = {
				labels: []
			};
			const options = {
				staleLabels: [ 'pending:feedback' ]
			};

			expect( isPendingIssueStale( issue, options ) ).toEqual( false );
		} );

		it( 'should return false if issue does not have a pending label', () => {
			const issue = {
				labels: [ 'type:bug' ]
			};
			const options = {
				staleLabels: [ 'pending:feedback' ]
			};

			expect( isPendingIssueStale( issue, options ) ).toEqual( false );
		} );

		it( 'should return false if issue does not have all pending labels', () => {
			const issue = {
				labels: [ 'type:bug', 'pending:feedback' ]
			};
			const options = {
				staleLabels: [ 'pending:feedback', 'pending:even-more-feedback' ]
			};

			expect( isPendingIssueStale( issue, options ) ).toEqual( false );
		} );

		it( 'should return true if issue have all pending labels - single label', () => {
			const issue = {
				labels: [ 'type:bug', 'pending:feedback' ]
			};
			const options = {
				staleLabels: [ 'pending:feedback' ]
			};

			expect( isPendingIssueStale( issue, options ) ).toEqual( true );
		} );

		it( 'should return true if issue have all pending labels - multiple labels', () => {
			const issue = {
				labels: [ 'type:bug', 'pending:feedback', 'pending:even-more-feedback' ]
			};
			const options = {
				staleLabels: [ 'pending:feedback', 'pending:even-more-feedback' ]
			};

			expect( isPendingIssueStale( issue, options ) ).toEqual( true );
		} );
	} );
} );
