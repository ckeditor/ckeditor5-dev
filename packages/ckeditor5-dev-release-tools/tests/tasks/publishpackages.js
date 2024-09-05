/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import upath from 'upath';
import { glob } from 'glob';
import assertNpmAuthorization from '../../lib/utils/assertnpmauthorization';
import assertPackages from '../../lib/utils/assertpackages';
import assertNpmTag from '../../lib/utils/assertnpmtag';
import assertFilesToPublish from '../../lib/utils/assertfilestopublish';
import executeInParallel from '../../lib/utils/executeinparallel';
import publishPackageOnNpmCallback from '../../lib/utils/publishpackageonnpmcallback';
import publishPackages from '../../lib/tasks/publishpackages';

vi.mock( 'glob' );
vi.mock( '../../lib/utils/assertnpmauthorization' );
vi.mock( '../../lib/utils/assertpackages' );
vi.mock( '../../lib/utils/assertnpmtag' );
vi.mock( '../../lib/utils/assertfilestopublish' );
vi.mock( '../../lib/utils/executeinparallel' );
vi.mock( '../../lib/utils/publishpackageonnpmcallback' );

describe( 'publishPackages()', () => {
	beforeEach( () => {
		vi.mocked( glob ).mockResolvedValue( [] );
		vi.mocked( assertNpmAuthorization ).mockResolvedValue();
		vi.mocked( assertPackages ).mockResolvedValue();
		vi.mocked( assertNpmTag ).mockResolvedValue();
		vi.mocked( assertFilesToPublish ).mockResolvedValue();
		vi.mocked( executeInParallel ).mockResolvedValue();
		vi.mocked( publishPackageOnNpmCallback ).mockResolvedValue();
	} );

	it( 'should not throw if all assertion passes', async () => {
		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} );
	} );

	it( 'should read the package directory (default `cwd`)', async () => {
		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} );

		expect( vi.mocked( glob ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			'*/',
			expect.objectContaining( {
				cwd: upath.join( process.cwd(), 'packages' ),
				absolute: true
			} ) );
	} );

	it( 'should read the package directory (custom `cwd`)', async () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/work/project' );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} );

		expect( vi.mocked( glob ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			'*/',
			expect.objectContaining( {
				cwd: '/work/project/packages',
				absolute: true
			} ) );
	} );

	it( 'should assert npm authorization', async () => {
		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} );

		expect( vi.mocked( assertNpmAuthorization ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( assertNpmAuthorization ) ).toHaveBeenCalledWith( 'pepe' );
	} );

	it( 'should throw if npm authorization assertion failed', async () => {
		vi.mocked( assertNpmAuthorization ).mockRejectedValue(
			new Error( 'You must be logged to npm as "pepe" to execute this release step.' )
		);

		await expect( publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'fake-pepe'
		} ) ).rejects.toThrow( 'You must be logged to npm as "pepe" to execute this release step.' );
	} );

	it( 'should assert that each found directory is a package', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/work/project/packages/ckeditor5-foo',
			'/work/project/packages/ckeditor5-bar'
		] );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} );

		expect( vi.mocked( assertPackages ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( assertPackages ) ).toHaveBeenCalledWith(
			[
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			],
			{
				requireEntryPoint: false,
				optionalEntryPointPackages: []
			}
		);
	} );

	// See: https://github.com/ckeditor/ckeditor5/issues/15127.
	it( 'should allow enabling the "package entry point" validator', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/work/project/packages/ckeditor5-foo',
			'/work/project/packages/ckeditor5-bar'
		] );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe',
			requireEntryPoint: true,
			optionalEntryPointPackages: [
				'ckeditor5-foo'
			]
		} );

		expect( vi.mocked( assertPackages ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( assertPackages ) ).toHaveBeenCalledWith(
			[
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			],
			{
				requireEntryPoint: true,
				optionalEntryPointPackages: [
					'ckeditor5-foo'
				]
			}
		);
	} );

	it( 'should throw if package assertion failed', async () => {
		vi.mocked( assertPackages ).mockRejectedValue(
			new Error( 'The "package.json" file is missing in the "ckeditor5-foo" package.' )
		);

		await expect( publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} ) ).rejects.toThrow( 'The "package.json" file is missing in the "ckeditor5-foo" package.' );
	} );

	it( 'should assert that each required file exists in the package directory (no optional entries)', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/work/project/packages/ckeditor5-foo',
			'/work/project/packages/ckeditor5-bar'
		] );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} );

		expect( vi.mocked( assertFilesToPublish ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( assertFilesToPublish ) ).toHaveBeenCalledWith(
			[
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			],
			null
		);
	} );

	it( 'should assert that each required file exists in the package directory (with optional entries)', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/work/project/packages/ckeditor5-foo',
			'/work/project/packages/ckeditor5-bar'
		] );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe',
			optionalEntries: {
				'ckeditor5-foo': [ 'src' ]
			}
		} );

		expect( vi.mocked( assertFilesToPublish ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( assertFilesToPublish ) ).toHaveBeenCalledWith(
			[
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			],
			{
				'ckeditor5-foo': [ 'src' ]
			}
		);
	} );

	it( 'should throw if not all required files exist in the package directory', async () => {
		vi.mocked( assertFilesToPublish ).mockRejectedValue(
			new Error( 'Missing files in "ckeditor5-foo" package for entries: "src"' )
		);

		await expect( publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} ) ).rejects.toThrow( 'Missing files in "ckeditor5-foo" package for entries: "src"' );
	} );

	it( 'should assert that version tag matches the npm tag (default npm tag)', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/work/project/packages/ckeditor5-foo',
			'/work/project/packages/ckeditor5-bar'
		] );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} );

		expect( vi.mocked( assertNpmTag ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( assertNpmTag ) ).toHaveBeenCalledWith(
			[
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			],
			'staging'
		);
	} );

	it( 'should assert that version tag matches the npm tag (custom npm tag)', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/work/project/packages/ckeditor5-foo',
			'/work/project/packages/ckeditor5-bar'
		] );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe',
			npmTag: 'nightly'
		} );

		expect( vi.mocked( assertNpmTag ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( assertNpmTag ) ).toHaveBeenCalledWith(
			[
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			],
			'nightly'
		);
	} );

	it( 'should throw if version tag does not match the npm tag', async () => {
		vi.mocked( assertNpmTag ).mockRejectedValue(
			new Error( 'The version tag "rc" from "ckeditor5-foo" package does not match the npm tag "staging".' )
		);

		await expect( publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} ) ).rejects.toThrow( 'The version tag "rc" from "ckeditor5-foo" package does not match the npm tag "staging".' );
	} );

	it( 'should pass parameters for publishing packages', async () => {
		const listrTask = {};
		const abortController = new AbortController();

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe',
			npmTag: 'nightly',
			listrTask,
			signal: abortController.signal,
			concurrency: 3,
			cwd: '/home/cwd'
		} );

		expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledWith( {
			packagesDirectory: 'packages',
			listrTask,
			taskToExecute: publishPackageOnNpmCallback,
			taskOptions: { npmTag: 'nightly' },
			signal: abortController.signal,
			concurrency: 3,
			cwd: '/home/cwd'
		} );
	} );

	it( 'should publish packages on npm if confirmation callback is not set', async () => {
		const listrTask = {};

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe',
			listrTask
		} );

		expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledOnce();
	} );

	it( 'should publish packages on npm if synchronous confirmation callback returns truthy value', async () => {
		const confirmationCallback = vi.fn().mockReturnValue( true );
		const listrTask = {};

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe',
			confirmationCallback,
			listrTask
		} );

		expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledOnce();
	} );

	it( 'should publish packages on npm if asynchronous confirmation callback returns truthy value', async () => {
		const confirmationCallback = vi.fn().mockResolvedValue( true );
		const listrTask = {};

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe',
			confirmationCallback,
			listrTask
		} );

		expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledOnce();
	} );

	it( 'should not publish packages on npm if synchronous confirmation callback returns falsy value', async () => {
		const confirmationCallback = vi.fn().mockReturnValue( false );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe',
			confirmationCallback
		} );

		expect( vi.mocked( executeInParallel ) ).not.toHaveBeenCalledOnce();
		expect( confirmationCallback ).toHaveBeenCalledOnce();
	} );

	it( 'should not publish packages on npm if asynchronous confirmation callback returns falsy value', async () => {
		const confirmationCallback = vi.fn().mockResolvedValue( false );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe',
			confirmationCallback
		} );

		expect( vi.mocked( executeInParallel ) ).not.toHaveBeenCalledOnce();
		expect( confirmationCallback ).toHaveBeenCalledOnce();
	} );

	it( 'should throw if publishing packages on npm failed', async () => {
		vi.mocked( executeInParallel ).mockRejectedValue(
			new Error( 'Unable to publish "ckeditor5-foo" package.' )
		);

		await expect( publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} ) ).rejects.toThrow(
			'Unable to publish "ckeditor5-foo" package.'
		);
	} );
} )
;
