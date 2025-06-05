/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logInfo } from '../../src/utils/loginfo.js';
import { commitChanges } from '../../src/utils/commitchanges.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( 'chalk', () => ( {
	default: {
		cyan: vi.fn( ( text: string ) => text ),
		red: vi.fn( ( text: string ) => text )
	}
} ) );
vi.mock( '../../src/utils/loginfo.js' );
vi.mock( '../../src/utils/constants.js', () => ( {
	CHANGELOG_FILE: 'CHANGES.md'
} ) );

describe( 'commitChanges()', () => {
	beforeEach( () => {
		vi.mocked( tools.commit ).mockResolvedValue( undefined );
	} );

	it( 'should print a message when committing changes (single repository)', async () => {
		await commitChanges( '1.0.0', [
			{ cwd: '/home/ckeditor/ckeditor5', isRoot: true, filePaths: [] }
		] );

		expect( chalk.cyan ).toHaveBeenCalledTimes( 1 );
		expect( logInfo ).toHaveBeenCalledWith( '○ Committing changes...' );
		expect( logInfo ).toHaveBeenCalledWith( '◌ Processing "/home/ckeditor/ckeditor5".', { indent: 1 } );
	} );

	it( 'should print a message when committing changes (including external)', async () => {
		await commitChanges( '1.0.0', [
			{ cwd: '/home/ckeditor/ckeditor5', isRoot: true, filePaths: [] },
			{ cwd: '/home/ckeditor/ckeditor5/external/ckeditor5-dev', isRoot: false, filePaths: [] }
		] );

		expect( chalk.cyan ).toHaveBeenCalledTimes( 1 );
		expect( logInfo ).toHaveBeenCalledWith( '○ Committing changes...' );
		expect( logInfo ).toHaveBeenCalledWith( '◌ Processing "/home/ckeditor/ckeditor5".', { indent: 1 } );
		expect( logInfo ).toHaveBeenCalledWith( '◌ Processing "/home/ckeditor/ckeditor5/external/ckeditor5-dev".', { indent: 1 } );
	} );

	it( 'should include a changelog file when processing a root repository', async () => {
		await commitChanges( '1.0.0', [
			{ cwd: '/home/ckeditor/ckeditor5', isRoot: true, filePaths: [] }
		] );

		expect( vi.mocked( tools.commit ) ).toHaveBeenCalledWith(
			expect.objectContaining( {
				files: expect.arrayContaining( [
					'/home/ckeditor/ckeditor5/CHANGES.md'
				] )
			} )
		);
	} );

	it( 'should not update the input array (reference) when adding a changelog file', async () => {
		const filePaths: Array<string> = [];

		await commitChanges( '1.0.0', [
			{ cwd: '/home/ckeditor/ckeditor5', isRoot: true, filePaths }
		] );

		expect( filePaths ).toHaveLength( 0 );
	} );

	it( 'should include the input files when making a commit', async () => {
		await commitChanges( '1.0.0', [
			{
				cwd: '/home/ckeditor/ckeditor5',
				isRoot: false,
				filePaths: [
					'/home/ckeditor/ckeditor5/changeset-1.md',
					'/home/ckeditor/ckeditor5/changeset-2.md'
				]
			}
		] );

		expect( vi.mocked( tools.commit ) ).toHaveBeenCalledWith(
			expect.objectContaining( {
				files: [
					'/home/ckeditor/ckeditor5/changeset-1.md',
					'/home/ckeditor/ckeditor5/changeset-2.md'
				]
			} )
		);
	} );

	it( 'should use a specified version when defining the commit message', async () => {
		await commitChanges( '1.0.0', [
			{ cwd: '/home/ckeditor/ckeditor5', isRoot: false, filePaths: [] }
		] );

		expect( vi.mocked( tools.commit ) ).toHaveBeenCalledWith(
			expect.objectContaining( {
				message: 'Changelog for v1.0.0. [skip ci]'
			} )
		);
	} );

	it( 'should use the specified `cwd` path when making a commit', async () => {
		await commitChanges( '1.0.0', [
			{ cwd: '/home/ckeditor/ckeditor5', isRoot: false, filePaths: [] }
		] );

		expect( vi.mocked( tools.commit ) ).toHaveBeenCalledWith(
			expect.objectContaining( {
				cwd: '/home/ckeditor/ckeditor5'
			} )
		);
	} );

	it( 'should commit the specified changes (integration)', async () => {
		await commitChanges( '1.0.0', [
			{
				cwd: '/home/ckeditor/ckeditor5',
				isRoot: true,
				filePaths: [
					'/home/ckeditor/ckeditor5/.changelog/changeset-1.md',
					'/home/ckeditor/ckeditor5/.changelog/changeset-2.md'
				]
			},
			{
				cwd: '/home/ckeditor/ckeditor5/external/ckeditor5-dev',
				isRoot: false,
				filePaths: [
					'/home/ckeditor/ckeditor5/external/ckeditor5-dev/.changelog/changeset-1.md',
					'/home/ckeditor/ckeditor5/external/ckeditor5-dev/.changelog/changeset-2.md',
					'/home/ckeditor/ckeditor5/external/ckeditor5-dev/.changelog/changeset-3.md'
				]
			},
			{
				cwd: '/home/ckeditor/ckeditor5/external/ckeditor5-internal',
				isRoot: false,
				filePaths: [
					'/home/ckeditor/ckeditor5/external/ckeditor5-internal/.changelog/changeset-1.md'
				]
			}
		] );

		expect( vi.mocked( tools.commit ) ).toHaveBeenCalledTimes( 3 );

		expect( vi.mocked( tools.commit ) ).toHaveBeenCalledWith( {
			cwd: '/home/ckeditor/ckeditor5',
			message: 'Changelog for v1.0.0. [skip ci]',
			files: [
				'/home/ckeditor/ckeditor5/CHANGES.md',
				'/home/ckeditor/ckeditor5/.changelog/changeset-1.md',
				'/home/ckeditor/ckeditor5/.changelog/changeset-2.md'
			]
		} );
		expect( vi.mocked( tools.commit ) ).toHaveBeenCalledWith( {
			cwd: '/home/ckeditor/ckeditor5/external/ckeditor5-dev',
			message: 'Changelog for v1.0.0. [skip ci]',
			files: [
				'/home/ckeditor/ckeditor5/external/ckeditor5-dev/.changelog/changeset-1.md',
				'/home/ckeditor/ckeditor5/external/ckeditor5-dev/.changelog/changeset-2.md',
				'/home/ckeditor/ckeditor5/external/ckeditor5-dev/.changelog/changeset-3.md'
			]
		} );
		expect( vi.mocked( tools.commit ) ).toHaveBeenCalledWith( {
			cwd: '/home/ckeditor/ckeditor5/external/ckeditor5-internal',
			message: 'Changelog for v1.0.0. [skip ci]',
			files: [
				'/home/ckeditor/ckeditor5/external/ckeditor5-internal/.changelog/changeset-1.md'
			]
		} );
	} );

	it( 'should not crash when an error occurs during commit', async () => {
		vi.mocked( tools.commit ).mockRejectedValueOnce( new Error( 'Commit failed' ) );

		await commitChanges( '1.0.0', [
			{ cwd: '/home/ckeditor/ckeditor5', isRoot: true, filePaths: [] }
		] );

		expect( chalk.cyan ).toHaveBeenCalledTimes( 1 );
		expect( logInfo ).toHaveBeenCalledWith( 'An error occurred while committing changes.', { indent: 2 } );
		expect( logInfo ).toHaveBeenCalledWith( 'Commit failed', { indent: 2 } );
	} );
} );
