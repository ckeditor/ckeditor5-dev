/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { removeChangelogEntryFiles } from '../../src/utils/removechangelogentryfiles.js';
import { logInfo } from '../../src/utils/loginfo.js';
import type { ChangesetPathsWithGithubUrl } from '../../src/types.js';

let mockReaddir: any;
let mockRm: any;

vi.mock( 'fs/promises', () => ( {
	readdir: ( ...args: Array<any> ) => mockReaddir( ...args ),
	rm: ( ...args: Array<any> ) => mockRm( ...args )
} ) );
vi.mock( 'chalk', () => ( {
	default: {
		cyan: ( text: string ) => text
	}
} ) );
vi.mock( '../../src/utils/loginfo.js' );

describe( 'removeChangelogEntryFiles()', () => {
	const mockChangesetFiles: Array<ChangesetPathsWithGithubUrl> = [
		{
			filePaths: [ '/repo/changelog/changeset-1.md' ],
			gitHubUrl: 'https://github.com/repo/changelog/changeset-1',
			shouldSkipLinks: false,
			cwd: '/changeset-path-1',
			isRoot: true
		},
		{
			filePaths: [ '/repo/changelog/changeset-2.md' ],
			gitHubUrl: 'https://github.com/repo/changelog/changeset-2',
			shouldSkipLinks: false,
			cwd: '/changeset-path-2',
			isRoot: false
		}
	];

	beforeEach( () => {
		vi.clearAllMocks();
		mockReaddir = vi.fn().mockResolvedValue( [
			{ name: 'changeset-1.md', isFile: () => true, isDirectory: () => false },
			{ name: '.gitkeep', isFile: () => true, isDirectory: () => false }
		] );
		mockRm = vi.fn().mockResolvedValue( undefined );
	} );

	it( 'should log the start of the process', async () => {
		await removeChangelogEntryFiles( mockChangesetFiles );

		expect( logInfo ).toHaveBeenCalledWith( '○ Removing the changeset files...' );
	} );

	it( 'should remove each changeset file', async () => {
		await removeChangelogEntryFiles( mockChangesetFiles );

		expect( mockReaddir ).toHaveBeenCalledWith( '/changeset-path-1/.changelog', { withFileTypes: true } );
		expect( mockReaddir ).toHaveBeenCalledWith( '/changeset-path-2/.changelog', { withFileTypes: true } );
		expect( mockRm ).toHaveBeenCalledWith( '/changeset-path-1/.changelog/changeset-1.md', { recursive: true, force: true } );
	} );

	it( 'should skip .gitkeep files', async () => {
		await removeChangelogEntryFiles( mockChangesetFiles );

		expect( mockRm ).not.toHaveBeenCalledWith( expect.stringContaining( '.gitkeep' ), expect.anything() );
	} );
} );
