/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import { removeChangelogEntryFiles } from '../../src/utils/removechangelogentryfiles.js';
import { logInfo } from '../../src/utils/loginfo.js';
import fs from 'fs-extra';
import type { ChangesetPathsWithGithubUrl } from '../../src/types.js';

vi.mock( 'fs-extra' );
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

	it( 'logs the start of the process', async () => {
		await removeChangelogEntryFiles( mockChangesetFiles );

		expect( logInfo ).toHaveBeenCalledWith( '○ Removing the changeset files...' );
	} );

	it( 'removes each changeset file', async () => {
		await removeChangelogEntryFiles( mockChangesetFiles );

		expect( fs.unlink ).toHaveBeenCalledWith( '/repo/changelog/changeset-1.md' );
		expect( fs.unlink ).toHaveBeenCalledWith( '/repo/changelog/changeset-2.md' );
	} );

	it( 'throws error when invalid file path passed to unlink', async () => {
		vi.mocked( fs.unlink ).mockRejectedValueOnce( new Error( 'ENOENT: no such file or directory' ) );

		await expect(
			removeChangelogEntryFiles( mockChangesetFiles )
		).rejects.toThrow();
	} );
} );
