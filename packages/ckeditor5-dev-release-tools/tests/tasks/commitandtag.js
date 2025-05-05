/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { glob } from 'glob';
import commitAndTag from '../../lib/tasks/commitandtag.js';
import { simpleGit } from 'simple-git';

vi.mock( 'simple-git' );
vi.mock( 'glob' );

describe( 'commitAndTag()', () => {
	let stubs;

	beforeEach( () => {
		stubs = {
			git: {
				tags: vi.fn(),
				add: vi.fn(),
				commit: vi.fn(),
				reset: vi.fn(),
				log: vi.fn(),
				addAnnotatedTag: vi.fn()
			}
		};

		vi.spyOn( process, 'cwd' ).mockReturnValue( '/home/ckeditor' );

		vi.mocked( simpleGit ).mockReturnValue( stubs.git );

		vi.mocked( glob ).mockResolvedValue( [] );

		stubs.git.tags.mockResolvedValue( {
			all: []
		} );
	} );

	it( 'should not create a commit and tag if there are no files modified', async () => {
		await commitAndTag( { files: [] } );

		expect( stubs.git.commit ).not.toHaveBeenCalled();
		expect( stubs.git.addAnnotatedTag ).not.toHaveBeenCalled();
	} );

	it( 'should not create a commit and tag if the specified version is already tagged', async () => {
		stubs.git.tags.mockResolvedValue( {
			all: [
				'v1.0.0'
			]
		} );
		await commitAndTag( { files: [ 'package.json' ], version: '1.0.0' } );

		expect( stubs.git.commit ).not.toHaveBeenCalled();
		expect( stubs.git.addAnnotatedTag ).not.toHaveBeenCalled();
	} );

	it( 'should allow to specify custom cwd', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package.json' ] );

		await commitAndTag( { version: '1.0.0', cwd: 'my-cwd', files: [] } );

		expect( vi.mocked( simpleGit ) ).toHaveBeenCalledExactlyOnceWith( {
			baseDir: 'my-cwd'
		} );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith( expect.anything(), expect.objectContaining( {
			cwd: 'my-cwd'
		} ) );
	} );

	it( 'should use the default cwd when not specified', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package.json' ] );

		await commitAndTag( { version: '1.0.0', files: [] } );

		expect( vi.mocked( simpleGit ) ).toHaveBeenCalledExactlyOnceWith( {
			baseDir: '/home/ckeditor'
		} );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith( expect.anything(), expect.objectContaining( {
			cwd: '/home/ckeditor'
		} ) );
	} );

	it( 'should commit given files with a release message', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package.json', 'packages/ckeditor5-foo/package.json' ] );

		await commitAndTag( { version: '1.0.0', packagesDirectory: 'packages', files: [ '**/package.json' ] } );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith( expect.anything(), expect.objectContaining( {
			absolute: true,
			nodir: true
		} ) );

		expect( stubs.git.add ).toHaveBeenCalledExactlyOnceWith( [
			'package.json',
			'packages/ckeditor5-foo/package.json'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledExactlyOnceWith( 'Release: v1.0.0. [skip ci]' );
	} );

	it( 'should not add skip ci to the commit when skipCi is set as false', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package.json', 'packages/ckeditor5-foo/package.json' ] );

		await commitAndTag( { version: '1.0.0', packagesDirectory: 'packages', files: [ '**/package.json' ], skipCi: false } );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith( expect.anything(), expect.objectContaining( {
			absolute: true,
			nodir: true
		} ) );

		expect( stubs.git.add ).toHaveBeenCalledExactlyOnceWith( [
			'package.json',
			'packages/ckeditor5-foo/package.json'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledExactlyOnceWith( 'Release: v1.0.0.' );
	} );

	it( 'should add a tag to the created commit', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package.json' ] );

		await commitAndTag( { version: '1.0.0', packagesDirectory: 'packages' } );

		expect( stubs.git.addAnnotatedTag ).toHaveBeenCalledExactlyOnceWith( 'v1.0.0', 'Release: v1.0.0.' );
	} );

	it( 'should add a tag to the created commit with a correct message when skipCi is true', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package.json' ] );

		await commitAndTag( { version: '1.0.0', packagesDirectory: 'packages', skipCi: true } );

		expect( stubs.git.addAnnotatedTag ).toHaveBeenCalledExactlyOnceWith( 'v1.0.0', 'Release: v1.0.0.' );
	} );

	it( 'should create a commit in dry run mode without creating a tag and then reset it', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package.json', 'packages/ckeditor5-foo/package.json' ] );
		vi.mocked( stubs.git.log ).mockResolvedValue( { latest: { hash: 'previousmockhash' } } );

		await commitAndTag( {
			version: '1.0.0',
			packagesDirectory: 'packages',
			files: [ '**/package.json' ],
			dryRun: true
		} );

		expect( stubs.git.log ).toHaveBeenCalledExactlyOnceWith( [ '-1' ] );
		expect( stubs.git.add ).toHaveBeenCalledExactlyOnceWith( [
			'package.json',
			'packages/ckeditor5-foo/package.json'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledExactlyOnceWith( 'Release: v1.0.0. [skip ci]' );
		expect( stubs.git.reset ).toHaveBeenCalledExactlyOnceWith( [ 'previousmockhash' ] );

		expect( stubs.git.addAnnotatedTag ).not.toHaveBeenCalled();
	} );

	it( 'should not run git reset when commit in dry run throws an error', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package.json', 'packages/ckeditor5-foo/package.json' ] );
		vi.mocked( stubs.git.commit ).mockRejectedValue( new Error( 'Error executing git commit in dry run mode.' ) );
		vi.mocked( stubs.git.log ).mockResolvedValue( { latest: { hash: 'previousmockhash' } } );
		vi.spyOn( console, 'log' ).mockImplementation( () => {} );

		await expect( commitAndTag( {
			version: '1.0.0',
			packagesDirectory: 'packages',
			files: [ '**/package.json' ],
			dryRun: true
		} ) ).rejects.toThrow( 'Error executing git commit in dry run mode.' );

		expect( stubs.git.log ).toHaveBeenCalledExactlyOnceWith( [ '-1' ] );
		expect( stubs.git.add ).toHaveBeenCalledExactlyOnceWith( [
			'package.json',
			'packages/ckeditor5-foo/package.json'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledExactlyOnceWith( 'Release: v1.0.0. [skip ci]' );

		expect( stubs.git.reset ).not.toHaveBeenCalled();
		expect( stubs.git.addAnnotatedTag ).not.toHaveBeenCalled();
	} );

	it( 'should split adding files to commit into chunks if they exceed the character limit', async () => {
		const numberOfFiles = 500;

		vi.mocked( glob ).mockResolvedValue(
			new Array( numberOfFiles ).fill().map( ( _, i ) => `very/long/path/foo/bar/file_${ i }.js` )
		);

		await commitAndTag( { version: '1.0.0', packagesDirectory: 'packages', files: [ '**/package.json' ] } );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith( expect.anything(), expect.objectContaining( {
			absolute: true,
			nodir: true
		} ) );

		expect( stubs.git.add ).toHaveBeenCalledTimes( 5 );

		/**
		 * First chunk is larger because `file_1` is shorter filename than `file_100`,
		 * and more files can fit within the given character limit.
		 *
		 * Sum should equal given number of files resolved by glob.
		 */
		const expectedChunkSizes = [ 117, 114, 114, 114, 41 ];
		const expectedChunkSizesSum = expectedChunkSizes.reduce( ( a, b ) => a + b );

		expect( expectedChunkSizesSum, 'Sum of expected chunks does not equal total number of files' ).toEqual( numberOfFiles );

		expectedChunkSizes.forEach( ( expectedChunkSize, i ) => {
			expect( stubs.git.add.mock.calls[ i ][ 0 ], `Chunk indexed "${ i }" has unexpected size` ).toHaveLength( expectedChunkSize );
		} );

		expect( stubs.git.commit ).toHaveBeenCalledExactlyOnceWith( 'Release: v1.0.0. [skip ci]' );
	} );
} );
