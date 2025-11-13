/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import commit from '../../src/tools/commit.js';
import { simpleGit } from 'simple-git';
import { glob } from 'glob';
import fs from 'fs/promises';
import upath from 'upath';

vi.mock( 'simple-git' );
vi.mock( 'glob' );
vi.mock( 'fs/promises' );

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
				raw: vi.fn(),
				status: vi.fn().mockResolvedValue( { isClean: () => false } )
			}
		};

		vi.mocked( simpleGit ).mockReturnValue( stubs.git as any );
		vi.mocked( glob ).mockResolvedValue( [] );

		stubs.git.raw!.mockResolvedValue( [
			'100644 7d49f7d30b961a267eacbef57233d92358bb06ad 0	package.json',
			'100644 7d49f7d30b961a267eacbef57233d92358bb06ad 0	packages/ckeditor5-foo/package.json'
		].join( '\n' ) );
	} );

	it( 'should use the specified cwd when creating a Git instance (Unix-like)', async () => {
		await commit( {
			cwd: '/home/ckeditor',
			message: 'test',
			files: []
		} );

		expect( simpleGit ).toHaveBeenCalledWith( { baseDir: '/home/ckeditor' } );
	} );

	it( 'should use the specified cwd when creating a Git instance (Windows-like)', async () => {
		await commit( {
			cwd: 'C:\\home\\ckeditor',
			message: 'test',
			files: []
		} );

		expect( simpleGit ).toHaveBeenCalledWith( { baseDir: 'C:/home/ckeditor' } );
	} );

	it( 'should not create a commit when no files provided', async () => {
		await commit( {
			cwd: '/home/ckeditor',
			message: 'test',
			files: []
		} );

		expect( stubs.git.commit ).not.toHaveBeenCalled();
	} );

	it.each( [
		// Absolute file paths.
		{
			title: 'absolute file path (Unix-like)',
			cwd: '/home/ckeditor',
			files: [ '/home/ckeditor/package.json' ],
			tracked: [ 'package.json' ],
			expected: [ 'package.json' ]
		},
		{
			title: 'absolute file path (Windows-like)',
			cwd: 'C:\\home\\ckeditor',
			files: [ 'C:\\home\\ckeditor\\package.json' ],
			tracked: [ 'package.json' ],
			expected: [ 'package.json' ]
		},
		// Relative file paths.
		{
			title: 'relative file path (Unix-like)',
			cwd: '/home/ckeditor',
			files: [ 'package.json' ],
			tracked: [ 'package.json' ],
			expected: [ 'package.json' ]
		},
		{
			title: 'relative file path (Windows-like)',
			cwd: 'C:\\home\\ckeditor',
			files: [ 'package.json' ],
			tracked: [ 'package.json' ],
			expected: [ 'package.json' ]
		},
		// Absolute directory.
		{
			title: 'absolute directory (Unix-like)',
			cwd: '/home/ckeditor',
			files: [ '/home/ckeditor/packages' ],
			tracked: [],
			expected: [ 'packages' ]
		},
		{
			title: 'absolute directory (Windows-like)',
			cwd: 'C:\\home\\ckeditor',
			files: [ 'C:\\home\\ckeditor\\packages' ],
			tracked: [],
			expected: [ 'packages' ]
		},
		// Relative directory.
		{
			title: 'relative directory (Unix-like)',
			cwd: '/home/ckeditor',
			files: [ 'packages' ],
			tracked: [],
			expected: [ 'packages' ]
		},
		{
			title: 'relative directory (Windows-like)',
			cwd: 'C:\\home\\ckeditor',
			files: [ 'packages' ],
			tracked: [],
			expected: [ 'packages' ]
		}
	] )( 'should commit $title', async ( { cwd, files, tracked, expected } ) => {
		// Setup Git-tracked files
		stubs.git.raw!.mockResolvedValue(
			tracked.map( f => `100644 7d49f7d30b961a267eacbef57233d92358bb06ad 0	${ f }` ).join( '\n' )
		);

		// Mock access for untracked files to simulate presence
		vi.mocked( fs.access ).mockImplementation( async path => {
			// Allow all untracked paths to be considered "existing"
			if ( !tracked.includes( upath.normalize( upath.relative( cwd, path as string ) ) ) ) {
				return undefined as any;
			}
		} );

		await commit( {
			cwd,
			message: 'Changelog v1.0.0.',
			files
		} );

		expect( stubs.git.add ).toHaveBeenCalledWith( expected );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Changelog v1.0.0.' );
	} );

	it( 'should commit a tracked file that has been removed', async () => {
		stubs.git.raw!.mockResolvedValue(
			'100644 7d49f7d30b961a267eacbef57233d92358bb06ad 0	tracked-file-that-is-no-longer-here.txt\n'
		);
		vi.mocked( fs.access ).mockRejectedValue( new Error( 'ENOENT: no such file or directory' ) );

		await commit( {
			cwd: '/home/ckeditor',
			message: 'Changelog v1.0.0.',
			files: [
				'/home/ckeditor/tracked-file-that-is-no-longer-here.txt'
			]
		} );

		expect( stubs.git.add ).toHaveBeenCalledWith( [
			'tracked-file-that-is-no-longer-here.txt'
		] );

		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Changelog v1.0.0.' );
	} );

	it( 'should commit a tracked file with a space in its name', async () => {
		stubs.git.raw!.mockResolvedValue( '100644 7d49f7d30b961a267eacbef57233d92358bb06ad 0	"my file with space.txt"\n' );

		await commit( {
			cwd: '/home/ckeditor',
			message: 'Commit file with space',
			files: [
				'my file with space.txt'
			]
		} );

		expect( stubs.git.add ).toHaveBeenCalledWith( [ 'my file with space.txt' ] );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Commit file with space' );
	} );

	it( 'should commit an untracked but existing file with a space in its name', async () => {
		stubs.git.raw!.mockResolvedValue( '' );
		vi.mocked( fs.access ).mockResolvedValue( undefined );

		await commit( {
			cwd: '/home/ckeditor',
			message: 'Commit untracked file with space',
			files: [
				'my file with space.txt'
			]
		} );

		expect( stubs.git.add ).toHaveBeenCalledWith( [ 'my file with space.txt' ] );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Commit untracked file with space' );
	} );

	it( 'should skip commit if status is clean', async () => {
		stubs.git.status!.mockResolvedValue( { isClean: () => true } );

		await commit( {
			cwd: '/home/ckeditor',
			message: 'No changes',
			files: [ 'package.json' ]
		} );

		expect( stubs.git.commit ).not.toHaveBeenCalled();
	} );

	it( 'should commit during dry run and reset after', async () => {
		stubs.git.log!.mockResolvedValue( { latest: { hash: 'abc123' } } );

		await commit( {
			cwd: '/home/ckeditor',
			message: 'Dry run test',
			files: [ 'package.json' ],
			dryRun: true
		} );

		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Dry run test' );
		expect( stubs.git.reset ).toHaveBeenCalledWith( [ 'abc123' ] );
	} );

	it( 'should not reset if dry-run commit throws error', async () => {
		stubs.git.log!.mockResolvedValue( { latest: { hash: 'abc123' } } );
		stubs.git.commit!.mockRejectedValue( new Error( 'fail' ) );

		await expect( commit( {
			cwd: '/home/ckeditor',
			message: 'fail test',
			files: [ 'package.json' ],
			dryRun: true
		} ) ).rejects.toThrow( 'fail' );

		expect( stubs.git.reset ).not.toHaveBeenCalled();
	} );

	it( 'should skip untracked files that do not exist on disk and commit valid tracked ones using absolute paths', async () => {
		// Simulate tracked files: only `CHANGELOG.md` is tracked.
		stubs.git.raw!.mockResolvedValue( [
			'100644 7d49f7d30b961a267eacbef57233d92358bb06ad 0	CHANGELOG.md'
		].join( '\n' ) );

		// Only allow access to `CHANGELOG.md`, reject others
		vi.mocked( fs.access ).mockImplementation( async path => {
			if ( ( path as string ).includes( 'nonexistent.md' ) ) {
				throw new Error( 'ENOENT: no such file or directory' );
			}
		} );

		await commit( {
			cwd: '/home/ckeditor',
			message: 'Skip missing file',
			files: [
				'/home/ckeditor/CHANGELOG.md',
				'/home/ckeditor/.changelog/nonexistent.md'
			]
		} );

		expect( stubs.git.add ).toHaveBeenCalledWith( [
			'CHANGELOG.md'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Skip missing file' );
	} );

	it( 'should skip untracked files that do not exist on disk and commit valid tracked ones using relative paths', async () => {
		// Simulate tracked files: only `CHANGELOG.md` is tracked.
		stubs.git.raw!.mockResolvedValue( [
			'100644 7d49f7d30b961a267eacbef57233d92358bb06ad 0	CHANGELOG.md'
		].join( '\n' ) );

		// Only allow access to `CHANGELOG.md`, reject others
		vi.mocked( fs.access ).mockImplementation( async path => {
			if ( ( path as string ).includes( 'nonexistent.md' ) ) {
				throw new Error( 'ENOENT: no such file or directory' );
			}
		} );

		await commit( {
			cwd: '/home/ckeditor',
			message: 'Skip missing file',
			files: [
				'CHANGELOG.md',
				'.changelog/nonexistent.md'
			]
		} );

		expect( stubs.git.add ).toHaveBeenCalledWith( [
			'CHANGELOG.md'
		] );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Skip missing file' );
	} );

	it( 'should split adding files to commit into chunks if they exceed the character limit', async () => {
		const files = Array.from( { length: 200 }, ( _, i ) => `dir/verylongfilename_${ i }.js` );

		stubs.git.raw!.mockResolvedValue(
			files.map( f => `100644 7d49f7d30b961a267eacbef57233d92358bb06ad 0	${ f }` ).join( '\n' )
		);
		stubs.git.status!.mockResolvedValue( { isClean: () => false } );
		vi.mocked( fs.access ).mockResolvedValue( undefined );

		await commit( {
			files,
			cwd: '/home/ckeditor',
			message: 'Chunked commit'
		} );

		expect( stubs.git.add ).toHaveBeenCalled();
		expect( stubs.git.add!.mock.calls.length ).toBeGreaterThan( 1 );
		expect( stubs.git.commit ).toHaveBeenCalledWith( 'Chunked commit' );
	} );
} );
