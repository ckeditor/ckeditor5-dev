/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const expect = require( 'chai' ).expect;
const isPendingIssueToUnlabel = require( '../../lib/utils/ispendingissuetounlabel' );

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'isPendingIssueToUnlabel', () => {
		it( 'should be a function', () => {
			expect( isPendingIssueToUnlabel ).to.be.a( 'function' );
		} );

		it( 'should return false if issue does not have any comment', () => {
			const issue = {
				lastComment: null
			};

			expect( isPendingIssueToUnlabel( issue ) ).to.be.false;
		} );

		it( 'should return false if last comment was created by a team member', () => {
			const issue = {
				lastComment: {
					isExternal: false
				}
			};

			expect( isPendingIssueToUnlabel( issue ) ).to.be.false;
		} );

		it( 'should return true if last comment was created by a community member', () => {
			const issue = {
				lastComment: {
					isExternal: true
				}
			};

			expect( isPendingIssueToUnlabel( issue ) ).to.be.true;
		} );
	} );
} );
