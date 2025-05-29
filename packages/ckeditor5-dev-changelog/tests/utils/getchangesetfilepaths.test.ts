/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { glob } from 'glob';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { RepositoryConfig } from '../../src/types.js';
import { getChangesetFilePaths } from '../../src/utils/getchangesetfilepaths.js';

vi.mock( 'glob' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'getChangesetFilePaths()', () => {
	beforeEach( () => {
		vi.mocked( workspaces.getRepositoryUrl ).mockImplementation( ( ( cwd: string, options: object ) => {
			expect( options ).to.haveOwnProperty( 'async', true );

			if ( cwd === '/mock/current' ) {
				return Promise.resolve( 'https://github.com/ckeditor/current' );
			}

			if ( cwd === '/mock/repo1' ) {
				return Promise.resolve( 'https://github.com/ckeditor/repo1' );
			}

			if ( cwd === '/mock/repo2' ) {
				return Promise.resolve( 'https://github.com/ckeditor/repo2' );
			}

			return Promise.resolve( 'https://github.com/ckeditor/unknown' );
		} ) as any );
	} );

	it( 'should return file paths from both local and external repositories', async () => {
		const rootSkipLinks = true;
		const cwd = '/mock/current';
		const changesetsDirectory = 'changesets';
		const externalRepositories: Array<Required<RepositoryConfig>> = [
			{ cwd: '/mock/repo1', packagesDirectory: 'packages', shouldSkipLinks: true },
			{ cwd: '/mock/repo2', packagesDirectory: 'packages', shouldSkipLinks: false }
		];

		vi.mocked( glob ).mockImplementation( ( _, { cwd } ) => {
			if ( cwd === '/mock/current/changesets' ) {
				return Promise.resolve( [ '/mock/current/changesets/file1.md', '/mock/current/changesets/file2.md' ] );
			}

			if ( cwd === '/mock/repo1/changesets' ) {
				return Promise.resolve( [ '/mock/repo1/changesets/file3.md' ] );
			}

			if ( cwd === '/mock/repo2/changesets' ) {
				return Promise.resolve( [ '/mock/repo2/changesets/file4.md' ] );
			}

			return Promise.resolve( [] );
		} );

		const result = await getChangesetFilePaths( cwd, changesetsDirectory, externalRepositories, rootSkipLinks );

		expect( result ).toEqual( [
			{
				changesetPaths: [ '/mock/current/changesets/file1.md', '/mock/current/changesets/file2.md' ],
				gitHubUrl: 'https://github.com/ckeditor/current',
				skipLinks: true,
				isRoot: true,
				cwd: '/mock/current'
			},
			{
				changesetPaths: [ '/mock/repo1/changesets/file3.md' ],
				gitHubUrl: 'https://github.com/ckeditor/repo1',
				skipLinks: true,
				isRoot: false,
				cwd: '/mock/repo1'
			},
			{
				changesetPaths: [ '/mock/repo2/changesets/file4.md' ],
				gitHubUrl: 'https://github.com/ckeditor/repo2',
				skipLinks: false,
				isRoot: false,
				cwd: '/mock/repo2'
			}
		] );

		expect( glob ).toHaveBeenCalledTimes( 3 );
		expect( glob ).toHaveBeenCalledWith( '**/*.md', { cwd: '/mock/current/changesets', absolute: true } );
		expect( glob ).toHaveBeenCalledWith( '**/*.md', { cwd: '/mock/repo1/changesets', absolute: true } );
		expect( glob ).toHaveBeenCalledWith( '**/*.md', { cwd: '/mock/repo2/changesets', absolute: true } );
	} );

	it( 'should return only local changeset files if there are no external repositories', async () => {
		const rootSkipLinks = false;
		const cwd = '/mock/current';
		const changesetsDirectory = 'changesets';
		const externalRepositories: Array<Required<RepositoryConfig>> = [];

		vi.mocked( glob ).mockResolvedValue( [ '/mock/current/changesets/file1.md' ] );

		const result = await getChangesetFilePaths( cwd, changesetsDirectory, externalRepositories, rootSkipLinks );

		expect( result ).toEqual( [
			{
				changesetPaths: [ '/mock/current/changesets/file1.md' ],
				gitHubUrl: 'https://github.com/ckeditor/current',
				skipLinks: false,
				isRoot: true,
				cwd: '/mock/current'
			}
		] );

		expect( glob ).toHaveBeenCalledTimes( 1 );
		expect( glob ).toHaveBeenCalledWith( '**/*.md', { cwd: '/mock/current/changesets', absolute: true } );
	} );

	it( 'should return only external changeset files if there are no local files', async () => {
		const rootSkipLinks = false;
		const cwd = '/mock/current';
		const changesetsDirectory = 'changesets';
		const externalRepositories: Array<Required<RepositoryConfig>> = [
			{ cwd: '/mock/repo1', packagesDirectory: 'packages', shouldSkipLinks: false }
		];

		vi.mocked( glob ).mockImplementation( ( _, { cwd } ) => {
			if ( cwd === '/mock/current/changesets' ) {
				return Promise.resolve( [] );
			}

			if ( cwd === '/mock/repo1/changesets' ) {
				return Promise.resolve( [ '/mock/repo1/changesets/file3.md' ] );
			}

			return Promise.resolve( [] );
		} );

		const result = await getChangesetFilePaths( cwd, changesetsDirectory, externalRepositories, rootSkipLinks );

		expect( result ).toEqual( [
			{
				changesetPaths: [],
				gitHubUrl: 'https://github.com/ckeditor/current',
				skipLinks: false,
				cwd: '/mock/current',
				isRoot: true
			},
			{
				changesetPaths: [ '/mock/repo1/changesets/file3.md' ],
				gitHubUrl: 'https://github.com/ckeditor/repo1',
				skipLinks: false,
				cwd: '/mock/repo1',
				isRoot: false
			}
		] );

		expect( glob ).toHaveBeenCalledTimes( 2 );
		expect( glob ).toHaveBeenCalledWith( '**/*.md', { cwd: '/mock/current/changesets', absolute: true } );
		expect( glob ).toHaveBeenCalledWith( '**/*.md', { cwd: '/mock/repo1/changesets', absolute: true } );
	} );

	it( 'should return an empty array when no changeset files exist in any repository', async () => {
		const rootSkipLinks = false;
		const cwd = '/mock/current';
		const changesetsDirectory = 'changesets';
		const externalRepositories: Array<Required<RepositoryConfig>> = [
			{ cwd: '/mock/repo1', packagesDirectory: 'packages', shouldSkipLinks: false }
		];

		vi.mocked( glob ).mockImplementation( () => Promise.resolve( [] ) );

		const result = await getChangesetFilePaths( cwd, changesetsDirectory, externalRepositories, rootSkipLinks );

		expect( result ).toEqual( [
			{
				changesetPaths: [],
				gitHubUrl: 'https://github.com/ckeditor/current',
				skipLinks: false,
				isRoot: true,
				cwd: '/mock/current'
			},
			{
				changesetPaths: [],
				gitHubUrl: 'https://github.com/ckeditor/repo1',
				skipLinks: false,
				isRoot: false,
				cwd: '/mock/repo1'
			}
		] );

		expect( glob ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should handle errors gracefully by rejecting the promise', async () => {
		const rootSkipLinks = false;
		const cwd = '/mock/current';
		const changesetsDirectory = 'changesets';
		const externalRepositories: Array<Required<RepositoryConfig>> = [
			{ cwd: '/mock/repo1', packagesDirectory: 'packages', shouldSkipLinks: false }
		];

		vi.mocked( glob ).mockRejectedValueOnce( new Error( 'Glob failed' ) );

		await expect(
			getChangesetFilePaths( cwd, changesetsDirectory, externalRepositories, rootSkipLinks )
		).rejects.toThrow( 'Glob failed' );
	} );

	it( 'should normalize paths from Windows-style to POSIX format', async () => {
		const rootSkipLinks = false;
		const cwd = '/mock/current';
		const changesetsDirectory = 'changesets';
		const externalRepositories: Array<Required<RepositoryConfig>> = [];

		// Simulate Windows paths with backslashes
		vi.mocked( glob ).mockResolvedValue( [
			'C:\\mock\\current\\changesets\\file1.md',
			'C:\\mock\\current\\changesets\\subfolder\\file2.md'
		] );

		const result = await getChangesetFilePaths( cwd, changesetsDirectory, externalRepositories, rootSkipLinks );

		expect( result ).toEqual( [
			{
				// upath.normalize converts backslashes to forward slashes
				changesetPaths: [
					'C:/mock/current/changesets/file1.md',
					'C:/mock/current/changesets/subfolder/file2.md'
				],
				gitHubUrl: 'https://github.com/ckeditor/current',
				skipLinks: false,
				isRoot: true,
				cwd: '/mock/current'
			}
		] );

		expect( glob ).toHaveBeenCalledTimes( 1 );
	} );
} );
