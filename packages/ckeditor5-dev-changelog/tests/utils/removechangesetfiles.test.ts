/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import { removeChangesetFiles } from '../../src/utils/removechangesetfiles.js';
import { logInfo } from '../../src/utils/loginfo.js';
import fs from 'fs-extra';
import { removeEmptyDirs } from '../../src/utils/removeemptydirs.js';
import upath from 'upath';
import type { ChangesetPathsWithGithubUrl } from '../../src/types.js';

vi.mock( 'fs-extra' );
vi.mock( '../../src/utils/loginfo' );
vi.mock( '../../src/utils/removeemptydirs' );
vi.mock( 'chalk', () => ( {
	default: {
		cyan: ( text: string ) => text
	}
} ) );

describe( 'removeChangesetFiles()', () => {
	const mockCwd = '/repo';
	const mockChangelogDir = 'changelog';
	const mockExternalRepositories = [
		{ cwd: '/external-repo-1', packagesDirectory: 'packages' },
		{ cwd: '/external-repo-2', packagesDirectory: 'packages' }
	];
	const mockChangesetFiles: Array<ChangesetPathsWithGithubUrl> = [
		{
			changesetPaths: [ '/repo/changelog/changeset-1.md' ],
			gitHubUrl: 'https://github.com/repo/changelog/changeset-1',
			skipLinks: false,
			cwd: '/changeset-path-1',
			isRoot: false
		},
		{
			changesetPaths: [ '/repo/changelog/changeset-2.md' ],
			gitHubUrl: 'https://github.com/repo/changelog/changeset-2',
			skipLinks: false,
			cwd: '/changeset-path-2',
			isRoot: false
		}
	];

	it( 'logs the start of the process', async () => {
		await removeChangesetFiles( mockChangesetFiles, mockCwd, mockChangelogDir, mockExternalRepositories );

		expect( logInfo ).toHaveBeenCalledWith( '○ Removing the changeset files...' );
	} );

	it( 'removes each changeset file', async () => {
		await removeChangesetFiles( mockChangesetFiles, mockCwd, mockChangelogDir, mockExternalRepositories );

		expect( fs.unlink ).toHaveBeenCalledWith( '/repo/changelog/changeset-1.md' );
		expect( fs.unlink ).toHaveBeenCalledWith( '/repo/changelog/changeset-2.md' );
	} );

	it( 'removes empty directories for the main repository', async () => {
		await removeChangesetFiles( mockChangesetFiles, mockCwd, mockChangelogDir, mockExternalRepositories );

		expect( removeEmptyDirs ).toHaveBeenCalledWith( upath.join( mockCwd, mockChangelogDir ) );
	} );

	it( 'removes empty directories for external repositories', async () => {
		await removeChangesetFiles( mockChangesetFiles, mockCwd, mockChangelogDir, mockExternalRepositories );

		for ( const externalRepo of mockExternalRepositories ) {
			expect( removeEmptyDirs ).toHaveBeenCalledWith( upath.join( externalRepo.cwd, mockChangelogDir ) );
		}
	} );

	it( 'throws error when invalid file path passed to unlink', async () => {
		vi.mocked( fs.unlink ).mockRejectedValueOnce( new Error( 'ENOENT: no such file or directory' ) );

		await expect( removeChangesetFiles( mockChangesetFiles, mockCwd, mockChangelogDir, mockExternalRepositories ) )
			.rejects.toThrow();
	} );
} );
