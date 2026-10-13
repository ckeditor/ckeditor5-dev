/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { getBlobUrl, getHistoryUrl } from '../../src/utils/githuburls.js';

describe( 'GitHub URLs', () => {
	const rootTarget = { root: '.', slug: 'owner/repo' };
	const nestedTarget = { root: 'projects/cs', slug: 'owner/repo' };

	it( 'getBlobUrl() links to a file on a branch and encodes the path segments', () => {
		expect( getBlobUrl( nestedTarget, 'feature/x y', 'docs/a b.md' ) )
			.toBe( 'https://github.com/owner/repo/blob/feature/x%20y/projects/cs/docs/a%20b.md' );
	} );

	it( 'getHistoryUrl() links to the history of a file', () => {
		expect( getHistoryUrl( rootTarget, 'stable', '.ai-tasks/t/decisions/a.yml' ) )
			.toBe( 'https://github.com/owner/repo/commits/stable/.ai-tasks/t/decisions/a.yml' );
	} );
} );
