/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import saveChangelog from '../../lib/utils/savechangelog.js';

vi.mock( 'fs' );
vi.mock( 'path', () => ( {
	default: {
		join: vi.fn( ( ...chunks ) => chunks.join( '/' ) )
	}
} ) );
vi.mock( '../../lib/utils/constants.js', () => ( {
	CHANGELOG_FILE: 'changelog.md'
} ) );

describe( 'saveChangelog()', () => {
	it( 'saves the changelog (default cwd)', () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/tmp' );

		saveChangelog( 'New content.' );

		expect( vi.mocked( path ).join ).toHaveBeenCalledExactlyOnceWith( '/tmp', 'changelog.md' );
		expect( vi.mocked( fs ).writeFileSync ).toHaveBeenCalledExactlyOnceWith(
			'/tmp/changelog.md',
			'New content.',
			'utf-8'
		);
	} );

	it( 'saves the changelog (allows passing a custom cwd)', () => {
		saveChangelog( 'New content.', '/custom/cwd' );

		expect( vi.mocked( path ).join ).toHaveBeenCalledExactlyOnceWith( '/custom/cwd', 'changelog.md' );
		expect( vi.mocked( fs ).writeFileSync ).toHaveBeenCalledExactlyOnceWith(
			'/custom/cwd/changelog.md',
			'New content.',
			'utf-8'
		);
	} );
} );
