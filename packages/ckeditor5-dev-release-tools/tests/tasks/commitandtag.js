/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { glob } from 'glob';
import { simpleGit } from 'simple-git';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import commitAndTag from '../../lib/tasks/commitandtag.js';

vi.mock( 'simple-git' );
vi.mock( 'glob' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'commitAndTag()', () => {
	let stubs;

	beforeEach( () => {
		stubs = {
			git: {
				tags: vi.fn(),
				add: vi.fn(),
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

		expect( tools.commit ).not.toHaveBeenCalled();
		expect( stubs.git.addAnnotatedTag ).not.toHaveBeenCalled();
	} );

	it( 'should not create a commit and tag if the specified version is already tagged', async () => {
		stubs.git.tags.mockResolvedValue( {
			all: [
				'v1.0.0'
			]
		} );
		await commitAndTag( { files: [ 'package.json' ], version: '1.0.0' } );

		expect( tools.commit ).not.toHaveBeenCalled();
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

		expect( tools.commit ).toHaveBeenCalledExactlyOnceWith( {
			cwd: '/home/ckeditor',
			files: [
				'package.json',
				'packages/ckeditor5-foo/package.json'
			],
			message: 'Release: v1.0.0. [skip ci]'
		} );
	} );

	it( 'should not add skip ci to the commit when skipCi is set as false', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package.json', 'packages/ckeditor5-foo/package.json' ] );

		await commitAndTag( { version: '1.0.0', packagesDirectory: 'packages', files: [ '**/package.json' ], skipCi: false } );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith( expect.anything(), expect.objectContaining( {
			absolute: true,
			nodir: true
		} ) );

		expect( tools.commit ).toHaveBeenCalledExactlyOnceWith( {
			cwd: '/home/ckeditor',
			files: [
				'package.json',
				'packages/ckeditor5-foo/package.json'
			],
			message: 'Release: v1.0.0.'
		} );
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

		expect( tools.commit ).toHaveBeenCalledExactlyOnceWith( {
			cwd: '/home/ckeditor',
			files: [
				'package.json',
				'packages/ckeditor5-foo/package.json'
			],
			message: 'Release: v1.0.0. [skip ci]',
			dryRun: true
		} );
		expect( stubs.git.addAnnotatedTag ).not.toHaveBeenCalled();
	} );
} );
