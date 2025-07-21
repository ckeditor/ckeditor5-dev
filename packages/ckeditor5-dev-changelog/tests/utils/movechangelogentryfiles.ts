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
		vi.clearAllMocks();
		vi.mocked( fs.ensureDir ).mockResolvedValue();
		vi.mocked( fs.renameSync ).mockImplementation( () => {} );
		vi.mocked( simpleGit ).mockReturnValue( mockGit as any );
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

	it( 'should move all files to the target directory using renameSync', async () => {
		const targetChannel = 'rc';
		await moveChangelogEntryFiles( mockEntryPaths, targetChannel );

		expect( fs.rename ).toHaveBeenCalledWith(
			'/repo1/.changelog/file1.md',
			'/repo1/.changelog/rc/file1.md'
		);
		expect( fs.rename ).toHaveBeenCalledWith(
			'/repo1/.changelog/file2.md',
			'/repo1/.changelog/rc/file2.md'
		);
		expect( fs.rename ).toHaveBeenCalledWith(
			'/repo2/.changelog/file3.md',
			'/repo2/.changelog/rc/file3.md'
		);
		expect( fs.rename ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'should add files to git before and after moving', async () => {
		const targetChannel = 'alpha';
		await moveChangelogEntryFiles( mockEntryPaths, targetChannel );

		// Check git.add calls for each file (before and after move)
		expect( mockGit.add ).toHaveBeenCalledWith( '/repo1/.changelog/file1.md' );
		expect( mockGit.add ).toHaveBeenCalledWith( '/repo1/.changelog/alpha/file1.md' );
		expect( mockGit.add ).toHaveBeenCalledWith( '/repo1/.changelog/file2.md' );
		expect( mockGit.add ).toHaveBeenCalledWith( '/repo1/.changelog/alpha/file2.md' );
		expect( mockGit.add ).toHaveBeenCalledWith( '/repo2/.changelog/file3.md' );
		expect( mockGit.add ).toHaveBeenCalledWith( '/repo2/.changelog/alpha/file3.md' );
		expect( mockGit.add ).toHaveBeenCalledTimes( 6 );
	} );

	it( 'should return modified entry paths with both original and target file paths', async () => {
		const targetChannel = 'beta';
		const result = await moveChangelogEntryFiles( mockEntryPaths, targetChannel );

		expect( result ).toHaveLength( 2 );

		// First repository
		expect( result[ 0 ]! ).toEqual( {
			...mockEntryPaths[ 0 ],
			filePaths: [
				'/repo1/.changelog/beta/file1.md',
				'/repo1/.changelog/file1.md',
				'/repo1/.changelog/beta/file2.md',
				'/repo1/.changelog/file2.md'
			]
		} );

		// Second repository
		expect( result[ 1 ]! ).toEqual( {
			...mockEntryPaths[ 1 ],
			filePaths: [
				'/repo2/.changelog/beta/file3.md',
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
		const targetChannel = 'latest';
		const result = await moveChangelogEntryFiles( singleEntryPaths, targetChannel );

		expect( fs.ensureDir ).toHaveBeenCalledWith( '/repo1/.changelog/latest' );
		expect( fs.rename ).toHaveBeenCalledWith(
			'/repo1/.changelog/file1.md',
			'/repo1/.changelog/latest/file1.md'
		);
		expect( result[ 0 ]!.filePaths ).toEqual( [
			'/repo1/.changelog/latest/file1.md',
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
		const targetChannel = 'alpha';
		const result = await moveChangelogEntryFiles( emptyEntryPaths, targetChannel );

		expect( fs.ensureDir ).toHaveBeenCalledWith( '/repo1/.changelog/alpha' );
		expect( fs.renameSync ).not.toHaveBeenCalled();
		expect( mockGit.add ).not.toHaveBeenCalled();
		expect( result[ 0 ]!.filePaths ).toEqual( [] );
	} );

	it.each( [
		'alpha',
		'beta',
		'rc',
		'latest'
	] as const )( 'should handle target channel %s', async channel => {
		vi.clearAllMocks();
		vi.mocked( simpleGit ).mockReturnValue( mockGit as any );

		await moveChangelogEntryFiles( mockEntryPaths, channel );

		expect( logInfo ).toHaveBeenCalledWith( `○ Moving changelog entries to ${ channel }/ directory...` );
		expect( fs.ensureDir ).toHaveBeenCalledWith( `/repo1/.changelog/${ channel }` );
		expect( fs.ensureDir ).toHaveBeenCalledWith( `/repo2/.changelog/${ channel }` );
	} );

	it( 'should handle fs.ensureDir errors', async () => {
		const targetChannel = 'alpha';
		const error = new Error( 'Directory creation failed' );
		vi.mocked( fs.ensureDir ).mockRejectedValueOnce( error );

		await expect( moveChangelogEntryFiles( mockEntryPaths, targetChannel ) )
			.rejects.toThrow( 'Directory creation failed' );
	} );

	it( 'should handle fs.renameSync errors', async () => {
		const targetChannel = 'beta';
		const error = new Error( 'File rename failed' );
		vi.mocked( fs.rename ).mockImplementationOnce( () => {
			throw error;
		} );

		await expect( moveChangelogEntryFiles( mockEntryPaths, targetChannel ) )
			.rejects.toThrow( 'File rename failed' );
	} );

	it( 'should handle git.add errors', async () => {
		const targetChannel = 'rc';
		const error = new Error( 'Git add failed' );
		vi.mocked( mockGit.add ).mockRejectedValueOnce( error );

		await expect( moveChangelogEntryFiles( mockEntryPaths, targetChannel ) )
			.rejects.toThrow( 'Git add failed' );
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

		expect( fs.rename ).toHaveBeenCalledWith(
			'/repo1/.changelog/2025111200_feature-branch.md',
			'/repo1/.changelog/rc/2025111200_feature-branch.md'
		);
		expect( fs.rename ).toHaveBeenCalledWith(
			'/repo1/.changelog/20250111300_fix-bug-123.md',
			'/repo1/.changelog/rc/20250111300_fix-bug-123.md'
		);
	} );
} );
