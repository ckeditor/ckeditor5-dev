/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import getChangelog from '../../lib/utils/getchangelog.js';

vi.mock( 'fs' );
vi.mock( 'path', () => ( {
	default: {
		join: vi.fn()
	}
} ) );
vi.mock( '../../lib/utils/constants.js', () => ( {
	CHANGELOG_FILE: 'changelog.md'
} ) );

describe( 'getChangelog()', () => {
	beforeEach( () => {
		vi.mocked( path ).join.mockReturnValue( 'path-to-changelog' );
		vi.mocked( fs ).readFileSync.mockReturnValue( 'Content.' );
	} );

	it( 'resolves the changelog content when a file exists (using default cwd)', () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/home/ckeditor' );
		vi.mocked( fs ).existsSync.mockReturnValue( true );

		expect( getChangelog() ).to.equal( 'Content.' );
		expect( vi.mocked( path ).join ).toHaveBeenCalledExactlyOnceWith( '/home/ckeditor', 'changelog.md' );
		expect( vi.mocked( fs ).readFileSync ).toHaveBeenCalledExactlyOnceWith( 'path-to-changelog', 'utf-8' );
	} );

	it( 'resolves the changelog content when a file exists (using the specified cwd)', () => {
		vi.mocked( fs ).existsSync.mockReturnValue( true );

		expect( getChangelog( 'custom-cwd' ) ).to.equal( 'Content.' );
		expect( vi.mocked( path ).join ).toHaveBeenCalledExactlyOnceWith( 'custom-cwd', 'changelog.md' );
		expect( vi.mocked( fs ).readFileSync ).toHaveBeenCalledExactlyOnceWith( 'path-to-changelog', 'utf-8' );
	} );

	it( 'returns null if the changelog does not exist', () => {
		vi.mocked( fs ).existsSync.mockReturnValue( false );

		expect( getChangelog() ).to.equal( null );
	} );
} );
