/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { glob } from 'glob';
import commit from '../../src/tools/commit.js';
import { simpleGit } from 'simple-git';

vi.mock( 'simple-git' );
vi.mock( 'glob' );

describe( 'commit()', () => {
	let stubs: {
		git: Record<string, Mock>;
	};

	beforeEach( () => {
		stubs = {
			git: {
				add: vi.fn(),
				commit: vi.fn(),
				reset: vi.fn(),
				log: vi.fn(),
				raw: vi.fn().mockResolvedValue( '' )
			}
		};

		vi.spyOn( process, 'cwd' ).mockReturnValue( '/home/ckeditor' );

		vi.mocked( simpleGit ).mockReturnValue( stubs.git as any );

		vi.mocked( glob ).mockResolvedValue( [] );

		stubs.git.raw!.mockResolvedValue( 'package.json\npackages/ckeditor5-foo/package.json\n' );
	} );

	it( 'should not create a commit and tag if there are no files modified', async () => {
		await commit( {
			cwd: '/home/ckeditor',
			message: '',
			files: []
		} );

		expect( stubs.git.commit ).not.toHaveBeenCalled();
	} );

	it( 'should use the specified cwd', async () => {
		await commit( {
			cwd: '/home/ckeditor',
			message: '',
			files: [
				'CHANGELOG.md'
			]
		} );

		expect( vi.mocked( simpleGit ) ).toHaveBeenCalledWith( {
			baseDir: '/home/ckeditor'
		} );
	} );

	it( 'should commit given files with a release message', async () => {
		await commit( {
			cwd: '/home/ckeditor',
			message: 'Release: v1.0.0. [skip ci]',
			files: [
				'package.json',
				'packages/ckeditor5-foo/package.json'
			]
		} );

		expect( stubs.git.add ).toHaveBeenCalledWith( [
			'package.json',
			'packages/ckeditor5-foo/package.json'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Release: v1.0.0. [skip ci]' );
	} );

	it( 'should commit given files with a release message (input uses absolute paths)', async () => {
		// It returns a list of files tracked by git.
		stubs.git.raw!.mockResolvedValue( [
			'.changelog/20250606112657_ck_18067_new_changelog.md',
			'CHANGELOG.md'
		].join( '\n' ) );

		await commit( {
			cwd: '/home/ckeditor',
			message: 'Release: v1.0.0. [skip ci]',
			files: [
				'/home/ckeditor/CHANGELOG.md',
				'/home/ckeditor/.changelog/20250606112657_ck_18067_new_changelog.md'
			]
		} );

		expect( stubs.git.add ).toHaveBeenCalledWith( [
			'CHANGELOG.md',
			'.changelog/20250606112657_ck_18067_new_changelog.md'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Release: v1.0.0. [skip ci]' );
	} );

	it( 'should commit given files with a release message when Git returns Windows-like path', async () => {
		// It returns a list of files tracked by git.
		stubs.git.raw!.mockResolvedValue( [
			'.changelog\\20250606112657_ck_18067_new_changelog.md',
			'CHANGELOG.md'
		].join( '\n' ) );

		await commit( {
			cwd: '/home/ckeditor',
			message: 'Release: v1.0.0. [skip ci]',
			files: [
				'/home/ckeditor/CHANGELOG.md',
				'/home/ckeditor/.changelog/20250606112657_ck_18067_new_changelog.md'
			]
		} );

		expect( stubs.git.add ).toHaveBeenCalledWith( [
			'CHANGELOG.md',
			'.changelog/20250606112657_ck_18067_new_changelog.md'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Release: v1.0.0. [skip ci]' );
	} );

	it( 'should commit given files with a release message for input files using Windows-like paths', async () => {
		// It returns a list of files tracked by git.
		stubs.git.raw!.mockResolvedValue( [
			'.changelog/20250606112657_ck_18067_new_changelog.md',
			'CHANGELOG.md'
		].join( '\n' ) );

		await commit( {
			cwd: 'C:\\Users\\home\\ckeditor',
			message: 'Release: v1.0.0. [skip ci]',
			files: [
				'C:\\Users\\home\\ckeditor\\CHANGELOG.md',
				'C:\\Users\\home\\ckeditor\\.changelog/20250606112657_ck_18067_new_changelog.md'
			]
		} );

		expect( stubs.git.add ).toHaveBeenCalledWith( [
			'CHANGELOG.md',
			'.changelog/20250606112657_ck_18067_new_changelog.md'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Release: v1.0.0. [skip ci]' );
	} );

	it( 'should commit given files with a release message for input files and Git using Windows-like paths', async () => {
		// It returns a list of files tracked by git.
		stubs.git.raw!.mockResolvedValue( [
			'.changelog\\20250606112657_ck_18067_new_changelog.md',
			'CHANGELOG.md'
		].join( '\n' ) );

		await commit( {
			cwd: 'C:\\Users\\home\\ckeditor',
			message: 'Release: v1.0.0. [skip ci]',
			files: [
				'C:\\Users\\home\\ckeditor\\CHANGELOG.md',
				'C:\\Users\\home\\ckeditor\\.changelog/20250606112657_ck_18067_new_changelog.md'
			]
		} );

		expect( stubs.git.add ).toHaveBeenCalledWith( [
			'CHANGELOG.md',
			'.changelog/20250606112657_ck_18067_new_changelog.md'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Release: v1.0.0. [skip ci]' );
	} );

	it( 'should create a commit in dry run mode without creating a tag and then reset it', async () => {
		vi.mocked( stubs.git.log! ).mockResolvedValue( { latest: { hash: 'previousmockhash' } } );

		await commit( {
			cwd: '/home/ckeditor',
			message: 'Release: v1.0.0. [skip ci]',
			files: [
				'package.json',
				'packages/ckeditor5-foo/package.json'
			],
			dryRun: true
		} );

		expect( stubs.git.log ).toHaveBeenCalledWith( [ '-1' ] );
		expect( stubs.git.add ).toHaveBeenCalledWith( [
			'package.json',
			'packages/ckeditor5-foo/package.json'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Release: v1.0.0. [skip ci]' );
		expect( stubs.git.reset ).toHaveBeenCalledWith( [ 'previousmockhash' ] );
	} );

	it( 'should not run git reset when commit in dry run throws an error', async () => {
		vi.mocked( stubs.git.log! ).mockResolvedValue( { latest: { hash: 'previousmockhash' } } );
		vi.mocked( stubs.git.commit! ).mockRejectedValue( new Error( 'Error executing git commit in dry run mode.' ) );
		vi.spyOn( console, 'log' ).mockImplementation( () => {} );

		await expect( commit( {
			cwd: '/home/ckeditor',
			message: 'Release: v1.0.0. [skip ci]',
			files: [
				'package.json',
				'packages/ckeditor5-foo/package.json'
			],
			dryRun: true
		} ) ).rejects.toThrow( 'Error executing git commit in dry run mode.' );

		expect( stubs.git.log ).toHaveBeenCalledWith( [ '-1' ] );
		expect( stubs.git.add ).toHaveBeenCalledWith( [
			'package.json',
			'packages/ckeditor5-foo/package.json'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Release: v1.0.0. [skip ci]' );

		expect( stubs.git.reset ).not.toHaveBeenCalled();
	} );

	it( 'should split adding files to commit into chunks if they exceed the character limit', async () => {
		const numberOfFiles = 500;
		const files = new Array( numberOfFiles ).fill( null ).map( ( _, i ) => `very/long/path/foo/bar/file_${ i }.js` );

		stubs.git.raw!.mockResolvedValue( `package.json\n${ files.join( '\n' ) }` );

		await commit( {
			files,
			cwd: '/home/ckeditor',
			message: 'Release: v1.0.0. [skip ci]'
		} );

		expect( stubs.git.add ).toHaveBeenCalledTimes( 5 );

		// The first chunk is larger because `file_1` is a shorter string than `file_100`,
		// and more files can fit within the given character limit.
		//
		// Sum should equal the given number of files resolved by glob.
		const expectedChunkSizes = [ 117, 114, 114, 114, 41 ];
		const expectedChunkSizesSum = expectedChunkSizes.reduce( ( a, b ) => a + b );

		expect( expectedChunkSizesSum, 'Sum of expected chunks does not equal total number of files' ).toEqual( numberOfFiles );

		expectedChunkSizes.forEach( ( expectedChunkSize, i ) => {
			const [ inputArray ] = stubs.git.add!.mock.calls[ i ]!;

			expect( inputArray, `Chunk indexed "${ i }" has unexpected size` ).toHaveLength( expectedChunkSize );
		} );

		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Release: v1.0.0. [skip ci]' );
	} );

	it( 'should not add a file non-tracked by git', async () => {
		// It returns a list of files tracked by git.
		stubs.git.raw!.mockResolvedValue( [
			'.changelog/20250606112657_ck_18067_new_changelog.md',
			'CHANGELOG.md'
		].join( '\n' ) );

		await commit( {
			cwd: '/home/ckeditor',
			message: 'Release: v1.0.0. [skip ci]',
			files: [
				'CHANGELOG.md',
				'.changelog/20250606112657_ck_18067_new_changelog.md',
				'.changelog/20250606125408_ck_00000_invalid_file.md'
			]
		} );

		expect( stubs.git.add ).toHaveBeenCalledWith( [
			'CHANGELOG.md',
			'.changelog/20250606112657_ck_18067_new_changelog.md'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Release: v1.0.0. [skip ci]' );
	} );
} );
