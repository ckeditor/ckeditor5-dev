/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import isPendingIssueToUnlabel from '../../lib/utils/ispendingissuetounlabel.js';

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'isPendingIssueToUnlabel', () => {
		it( 'should be a function', () => {
			expect( isPendingIssueToUnlabel ).toBeInstanceOf( Function );
		} );

		it( 'should return false if issue does not have any comment', () => {
			const issue = {
				lastComment: null
			};

			expect( isPendingIssueToUnlabel( issue ) ).toEqual( false );
		} );

		it( 'should return false if last comment was created by a team member', () => {
			const issue = {
				lastComment: {
					isExternal: false
				}
			};

			expect( isPendingIssueToUnlabel( issue ) ).toEqual( false );
		} );

		it( 'should return true if last comment was created by a community member', () => {
			const issue = {
				lastComment: {
					isExternal: true
				}
			};

			expect( isPendingIssueToUnlabel( issue ) ).toEqual( true );
		} );
	} );
} );
