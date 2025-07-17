/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { moveChangelogEntryFiles } from '../../src/utils/movechangelogentryfiles.js';
import { logInfo } from '../../src/utils/loginfo.js';
import * as fs from 'fs-extra';
import type { ChangesetPathsWithGithubUrl } from '../../src/types.js';

vi.mock( 'fs-extra' );
vi.mock( '../../src/utils/loginfo.js' );
vi.mock( 'chalk', () => ( {
	default: {
		cyan: ( text: string ) => text
	}
} ) );

describe( 'moveChangelogEntryFiles()', () => {
	const mockEntryPaths: Array<ChangesetPathsWithGithubUrl> = [
		{
			filePaths: [ '/repo1changelog/file1', '/repo1changelog/file2.md' ],
			gitHubUrl: 'https://github.com/ckeditor/repo1',
			shouldSkipLinks: false,
			cwd: '/repo1',
			isRoot: true
		},
		{
			filePaths: [ '/repo2changelog/file3.md' ],
			gitHubUrl: 'https://github.com/ckeditor/repo2',
			shouldSkipLinks: true,
			cwd: '/repo2',
			isRoot: false
		}
	];

	beforeEach( () => {
		vi.clearAllMocks();
		vi.mocked( fs.ensureDir ).mockResolvedValue();
		vi.mocked( fs.move ).mockResolvedValue();
	} );

	it( 'should log the start of the process', async () => {
		const targetChannel = 'alpha';
		await moveChangelogEntryFiles( mockEntryPaths, targetChannel );

		expect( logInfo ).toHaveBeenCalledWith( '○ Moving changelog entries to alpha/ directory...' );
	} );

	it( 'should create target directory for each repository', async () => {
		const targetChannel = 'beta';
		await moveChangelogEntryFiles( mockEntryPaths, targetChannel );

		expect( fs.ensureDir ).toHaveBeenCalledWith( '/repo1/.changelog/beta' );
		expect( fs.ensureDir ).toHaveBeenCalledWith( '/repo2/.changelog/beta' );
		expect( fs.ensureDir ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should move all files to the target directory', async () => {
		const targetChannel = 'rc';
		await moveChangelogEntryFiles( mockEntryPaths, targetChannel );

		expect( fs.move ).toHaveBeenCalledWith(
			'/repo1changelog/file1',
			'/repo1/.changelog/rc/file1',
			{ overwrite: true }
		);
		expect( fs.move ).toHaveBeenCalledWith(
			'/repo1changelog/file2.md',
			'/repo1/.changelog/rc/file2.md',
			{ overwrite: true }
		);
		expect( fs.move ).toHaveBeenCalledWith(
			'/repo2changelog/file3.md',
			'/repo2/.changelog/rc/file3.md',
			{ overwrite: true }
		);
		expect( fs.move ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'should handle single repository with single file', async () => {
		const singleEntryPaths: Array<ChangesetPathsWithGithubUrl> = [
			{
				filePaths: [ '/repo1changelog/file1' ],
				gitHubUrl: 'https://github.com/ckeditor/repo1',
				shouldSkipLinks: false,
				cwd: '/repo1',
				isRoot: true
			}
		];
		const targetChannel = 'latest';
		await moveChangelogEntryFiles( singleEntryPaths, targetChannel );

		expect( fs.ensureDir ).toHaveBeenCalledWith( '/repo1/.changelog/latest' );
		expect( fs.move ).toHaveBeenCalledWith(
			'/repo1changelog/file1',
			'/repo1/.changelog/latest/file1',
			{ overwrite: true }
		);
	} );

	it( 'should handle empty file paths array', async () => {
		const emptyEntryPaths: Array<ChangesetPathsWithGithubUrl> = [
			{
				filePaths: [],
				gitHubUrl: 'https://github.com/ckeditor/repo1',
				shouldSkipLinks: false,
				cwd: '/repo1',
				isRoot: true
			}
		];
		const targetChannel = 'alpha';
		await moveChangelogEntryFiles( emptyEntryPaths, targetChannel );

		expect( fs.ensureDir ).toHaveBeenCalledWith( '/repo1/.changelog/alpha' );
		expect( fs.move ).not.toHaveBeenCalled();
	} );

	it( 'should handle different target channels', async () => {
		const channels = [ 'alpha', 'rc', 'latest' ] as const;

		for ( const channel of channels ) {
			vi.clearAllMocks();
			await moveChangelogEntryFiles( mockEntryPaths, channel );

			expect( logInfo ).toHaveBeenCalledWith( `○ Moving changelog entries to ${ channel }/ directory...` );
			expect( fs.ensureDir ).toHaveBeenCalledWith( `/repo1/.changelog/${ channel }` );
			expect( fs.ensureDir ).toHaveBeenCalledWith( `/repo2/.changelog/${ channel }` );
		}
	} );

	it( 'should handle fs.ensureDir errors', async () => {
		const targetChannel = 'alpha';
		const error = new Error( 'Directory creation failed' );
		vi.mocked( fs.ensureDir ).mockRejectedValueOnce( error );

		await expect( moveChangelogEntryFiles( mockEntryPaths, targetChannel ) )
			.rejects.toThrow( 'Directory creation failed' );
	} );

	it( 'should handle fs.move errors', async () => {
		const targetChannel = 'beta';
		const error = new Error( 'File move failed' );
		vi.mocked( fs.move ).mockRejectedValueOnce( error );

		await expect( moveChangelogEntryFiles( mockEntryPaths, targetChannel ) )
			.rejects.toThrow( 'File move failed' );
	} );

	it( 'should preserve file names when moving', async () => {
		const targetChannel = 'rc';
		const entryPathsWithComplexNames: Array<ChangesetPathsWithGithubUrl> = [
			{
				filePaths: [ '/repo1/.changelog/2025111200_feature-branch.md', '/repo1/.changelog/20250111300_fix-bug-123.md' ],
				gitHubUrl: 'https://github.com/ckeditor/repo1',
				shouldSkipLinks: false,
				cwd: '/repo1',
				isRoot: true
			}
		];

		await moveChangelogEntryFiles( entryPathsWithComplexNames, targetChannel );

		expect( fs.move ).toHaveBeenCalledWith(
			'/repo1/.changelog/2025111200_feature-branch.md',
			'/repo1/.changelog/rc/2025111200_feature-branch.md',
			{ overwrite: true }
		);
		expect( fs.move ).toHaveBeenCalledWith(
			'/repo1/.changelog/20250111300_fix-bug-123.md',
			'/repo1/.changelog/rc/20250111300_fix-bug-123.md',
			{ overwrite: true }
		);
	} );
} );
