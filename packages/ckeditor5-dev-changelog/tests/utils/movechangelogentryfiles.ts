/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { moveChangelogEntryFiles } from '../../src/utils/movechangelogentryfiles.js';
import { logInfo } from '../../src/utils/loginfo.js';
import fs from 'fs-extra';
import { simpleGit } from 'simple-git';
import type { ChangesetPathsWithGithubUrl } from '../../src/types.js';
import { PRE_RELEASE_DIRECTORY } from '../../src/utils/constants.js';

vi.mock( 'fs-extra' );
vi.mock( '../../src/utils/loginfo.js' );
vi.mock( 'simple-git' );
vi.mock( 'chalk', () => ( {
	default: {
		cyan: ( text: string ) => text
	}
} ) );

describe( 'moveChangelogEntryFiles()', () => {
	const mockEntryPaths: Array<ChangesetPathsWithGithubUrl> = [
		{
			filePaths: [ '/repo1/.changelog/file1.md', '/repo1/.changelog/file2.md' ],
			gitHubUrl: 'https://github.com/ckeditor/repo1',
			shouldSkipLinks: false,
			cwd: '/repo1',
			isRoot: true
		},
		{
			filePaths: [ '/repo2/.changelog/file3.md' ],
			gitHubUrl: 'https://github.com/ckeditor/repo2',
			shouldSkipLinks: true,
			cwd: '/repo2',
			isRoot: false
		}
	];

	const mockGit = {
		add: vi.fn().mockResolvedValue( undefined )
	};

	beforeEach( () => {
		vi.mocked( fs.ensureDir ).mockResolvedValue();
		vi.mocked( fs.rename ).mockResolvedValue();
		vi.mocked( simpleGit ).mockReturnValue( mockGit as any );
	} );

	it( 'should log the start of the process', async () => {
		await moveChangelogEntryFiles( mockEntryPaths );

		expect( logInfo ).toHaveBeenCalledWith( `○ Moving changelog entries to ${ PRE_RELEASE_DIRECTORY }/ directory...` );
	} );

	it( 'should create target directory for each repository', async () => {
		await moveChangelogEntryFiles( mockEntryPaths );

		expect( fs.ensureDir ).toHaveBeenCalledWith( `/repo1/.changelog/${ PRE_RELEASE_DIRECTORY }` );
		expect( fs.ensureDir ).toHaveBeenCalledWith( `/repo2/.changelog/${ PRE_RELEASE_DIRECTORY }` );
		expect( fs.ensureDir ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should move all files to the target directory using rename', async () => {
		await moveChangelogEntryFiles( mockEntryPaths );

		expect( fs.rename ).toHaveBeenCalledWith(
			'/repo1/.changelog/file1.md',
			`/repo1/.changelog/${ PRE_RELEASE_DIRECTORY }/file1.md`
		);
		expect( fs.rename ).toHaveBeenCalledWith(
			'/repo1/.changelog/file2.md',
			`/repo1/.changelog/${ PRE_RELEASE_DIRECTORY }/file2.md`
		);
		expect( fs.rename ).toHaveBeenCalledWith(
			'/repo2/.changelog/file3.md',
			`/repo2/.changelog/${ PRE_RELEASE_DIRECTORY }/file3.md`
		);
		expect( fs.rename ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'should return modified entry paths with both original and target file paths', async () => {
		const result = await moveChangelogEntryFiles( mockEntryPaths );

		expect( result ).toHaveLength( 2 );

		// First repository
		expect( result[ 0 ]! ).toEqual( {
			...mockEntryPaths[ 0 ],
			filePaths: [
				`/repo1/.changelog/${ PRE_RELEASE_DIRECTORY }/file1.md`,
				'/repo1/.changelog/file1.md',
				`/repo1/.changelog/${ PRE_RELEASE_DIRECTORY }/file2.md`,
				'/repo1/.changelog/file2.md'
			]
		} );

		// Second repository
		expect( result[ 1 ]! ).toEqual( {
			...mockEntryPaths[ 1 ],
			filePaths: [
				`/repo2/.changelog/${ PRE_RELEASE_DIRECTORY }/file3.md`,
				'/repo2/.changelog/file3.md'
			]
		} );
	} );

	it( 'should handle single repository with single file', async () => {
		const singleEntryPaths: Array<ChangesetPathsWithGithubUrl> = [
			{
				filePaths: [ '/repo1/.changelog/file1.md' ],
				gitHubUrl: 'https://github.com/ckeditor/repo1',
				shouldSkipLinks: false,
				cwd: '/repo1',
				isRoot: true
			}
		];
		const result = await moveChangelogEntryFiles( singleEntryPaths );

		expect( fs.ensureDir ).toHaveBeenCalledWith( `/repo1/.changelog/${ PRE_RELEASE_DIRECTORY }` );
		expect( fs.rename ).toHaveBeenCalledWith(
			'/repo1/.changelog/file1.md',
			`/repo1/.changelog/${ PRE_RELEASE_DIRECTORY }/file1.md`
		);
		expect( result[ 0 ]!.filePaths ).toEqual( [
			`/repo1/.changelog/${ PRE_RELEASE_DIRECTORY }/file1.md`,
			'/repo1/.changelog/file1.md'
		] );
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
		const result = await moveChangelogEntryFiles( emptyEntryPaths );

		expect( fs.ensureDir ).toHaveBeenCalledWith( `/repo1/.changelog/${ PRE_RELEASE_DIRECTORY }` );
		expect( fs.rename ).not.toHaveBeenCalled();
		expect( mockGit.add ).not.toHaveBeenCalled();
		expect( result[ 0 ]!.filePaths ).toEqual( [] );
	} );

	it( 'should handle fs.ensureDir errors', async () => {
		const error = new Error( 'Directory creation failed' );
		vi.mocked( fs.ensureDir ).mockRejectedValueOnce( error );

		await expect( moveChangelogEntryFiles( mockEntryPaths ) )
			.rejects.toThrow( 'Directory creation failed' );
	} );

	it( 'should handle fs.rename errors', async () => {
		const error = new Error( 'File rename failed' );
		vi.mocked( fs.rename ).mockRejectedValueOnce( error );

		await expect( moveChangelogEntryFiles( mockEntryPaths ) )
			.rejects.toThrow( 'File rename failed' );
	} );

	it( 'should preserve file names when moving', async () => {
		const entryPathsWithComplexNames: Array<ChangesetPathsWithGithubUrl> = [
			{
				filePaths: [ '/repo1/.changelog/2025111200_feature-branch.md', '/repo1/.changelog/20250111300_fix-bug-123.md' ],
				gitHubUrl: 'https://github.com/ckeditor/repo1',
				shouldSkipLinks: false,
				cwd: '/repo1',
				isRoot: true
			}
		];

		await moveChangelogEntryFiles( entryPathsWithComplexNames );

		expect( fs.rename ).toHaveBeenCalledWith(
			'/repo1/.changelog/2025111200_feature-branch.md',
			`/repo1/.changelog/${ PRE_RELEASE_DIRECTORY }/2025111200_feature-branch.md`
		);
		expect( fs.rename ).toHaveBeenCalledWith(
			'/repo1/.changelog/20250111300_fix-bug-123.md',
			`/repo1/.changelog/${ PRE_RELEASE_DIRECTORY }/20250111300_fix-bug-123.md`
		);
	} );
} );
