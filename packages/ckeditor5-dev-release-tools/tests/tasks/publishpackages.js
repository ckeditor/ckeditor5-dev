/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import { differenceInMilliseconds } from 'date-fns';
import assertNpmAuthorization from '../../lib/utils/assertnpmauthorization.js';
import assertPackages from '../../lib/utils/assertpackages.js';
import assertNpmTag from '../../lib/utils/assertnpmtag.js';
import assertFilesToPublish from '../../lib/utils/assertfilestopublish.js';
import executeInParallel from '../../lib/utils/executeinparallel.js';
import publishPackageOnNpmCallback from '../../lib/utils/publishpackageonnpmcallback.js';
import publishPackages from '../../lib/tasks/publishpackages.js';
import checkVersionAvailability from '../../lib/utils/checkversionavailability.js';
import findPathsToPackages from '../../lib/utils/findpathstopackages.js';

vi.mock( 'fs-extra' );
vi.mock( '../../lib/utils/assertnpmauthorization.js' );
vi.mock( '../../lib/utils/assertpackages.js' );
vi.mock( '../../lib/utils/assertnpmtag.js' );
vi.mock( '../../lib/utils/assertfilestopublish.js' );
vi.mock( '../../lib/utils/executeinparallel.js' );
vi.mock( '../../lib/utils/publishpackageonnpmcallback.js' );
vi.mock( '../../lib/utils/checkversionavailability.js' );
vi.mock( '../../lib/utils/findpathstopackages.js' );

describe( 'publishPackages()', () => {
	beforeEach( () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/work/project' );

		vi.mocked( findPathsToPackages ).mockResolvedValue( [] );
		vi.mocked( assertNpmAuthorization ).mockResolvedValue();
		vi.mocked( assertPackages ).mockResolvedValue();
		vi.mocked( assertNpmTag ).mockResolvedValue();
		vi.mocked( assertFilesToPublish ).mockResolvedValue();
		vi.mocked( executeInParallel ).mockResolvedValue();
		vi.mocked( publishPackageOnNpmCallback ).mockResolvedValue();

		vi.mocked( fs ).readJson.mockResolvedValue( { name: '', version: '' } );
		vi.mocked( checkVersionAvailability ).mockResolvedValue( true );
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

		expect( vi.mocked( findPathsToPackages ) ).toHaveBeenCalledWith( '/work/project', 'packages' );
	} );

	it( 'should read the package directory (custom `cwd`)', async () => {
		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe',
			cwd: '/work/custom-dir'
		} );

		expect( vi.mocked( findPathsToPackages ) ).toHaveBeenCalledWith( '/work/custom-dir', 'packages' );
	} );

	it( 'should assert npm authorization', async () => {
		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} );

		expect( vi.mocked( assertNpmAuthorization ) ).toHaveBeenCalledExactlyOnceWith( 'pepe' );
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
		vi.mocked( findPathsToPackages )
			.mockResolvedValueOnce( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] )
			.mockResolvedValue( [] );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} );

		expect( vi.mocked( assertPackages ) ).toHaveBeenCalledExactlyOnceWith(
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
		vi.mocked( findPathsToPackages )
			.mockResolvedValueOnce( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] )
			.mockResolvedValue( [] );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe',
			requireEntryPoint: true,
			optionalEntryPointPackages: [
				'ckeditor5-foo'
			]
		} );

		expect( vi.mocked( assertPackages ) ).toHaveBeenCalledExactlyOnceWith(
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
		vi.mocked( findPathsToPackages )
			.mockResolvedValueOnce( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] )
			.mockResolvedValue( [] );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} );

		expect( vi.mocked( assertFilesToPublish ) ).toHaveBeenCalledExactlyOnceWith(
			[
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			],
			null
		);
	} );

	it( 'should assert that each required file exists in the package directory (with optional entries)', async () => {
		vi.mocked( findPathsToPackages )
			.mockResolvedValueOnce( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] )
			.mockResolvedValue( [] );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe',
			optionalEntries: {
				'ckeditor5-foo': [ 'src' ]
			}
		} );

		expect( vi.mocked( assertFilesToPublish ) ).toHaveBeenCalledExactlyOnceWith(
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
		vi.mocked( findPathsToPackages )
			.mockResolvedValueOnce( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] )
			.mockResolvedValue( [] );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} );

		expect( vi.mocked( assertNpmTag ) ).toHaveBeenCalledExactlyOnceWith(
			[
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			],
			'staging'
		);
	} );

	it( 'should assert that version tag matches the npm tag (custom npm tag)', async () => {
		vi.mocked( findPathsToPackages )
			.mockResolvedValueOnce( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] )
			.mockResolvedValue( [] );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe',
			npmTag: 'nightly'
		} );

		expect( vi.mocked( assertNpmTag ) ).toHaveBeenCalledExactlyOnceWith(
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

	it( 'should use two threads by default when publishing packages', async () => {
		await publishPackages( {} );

		expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			concurrency: 2
		} ) );
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

		expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledExactlyOnceWith( {
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

	it( 'should verify if given package can be published', async () => {
		vi.mocked( findPathsToPackages )
			.mockResolvedValueOnce( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] )
			.mockResolvedValue( [] );

		vi.mocked( fs ).readJson
			.mockResolvedValueOnce( { name: '@ckeditor/ckeditor5-foo', version: '1.0.0' } )
			.mockResolvedValueOnce( { name: '@ckeditor/ckeditor5-bar', version: '1.0.0' } );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} );

		expect( vi.mocked( fs ).readJson ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs ).readJson ).toHaveBeenCalledWith( '/work/project/packages/ckeditor5-foo/package.json' );
		expect( vi.mocked( fs ).readJson ).toHaveBeenCalledWith( '/work/project/packages/ckeditor5-bar/package.json' );

		expect( vi.mocked( checkVersionAvailability ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( checkVersionAvailability ) ).toHaveBeenCalledWith( '1.0.0', '@ckeditor/ckeditor5-foo' );
		expect( vi.mocked( checkVersionAvailability ) ).toHaveBeenCalledWith( '1.0.0', '@ckeditor/ckeditor5-bar' );
	} );

	it( 'should remove a package if is already published', async () => {
		vi.mocked( findPathsToPackages )
			.mockResolvedValueOnce( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] )
			.mockResolvedValue( [] );

		vi.mocked( fs ).readJson
			.mockResolvedValueOnce( { name: '@ckeditor/ckeditor5-foo', version: '1.0.0' } )
			.mockResolvedValueOnce( { name: '@ckeditor/ckeditor5-bar', version: '1.0.0' } );

		vi.mocked( checkVersionAvailability )
			.mockResolvedValueOnce( false )
			.mockResolvedValueOnce( true );

		await publishPackages( {
			packagesDirectory: 'packages',
			npmOwner: 'pepe'
		} );

		expect( vi.mocked( fs ).remove ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fs ).remove ).toHaveBeenCalledWith( '/work/project/packages/ckeditor5-foo' );
	} );

	describe( 're-publish packages that could not be published', () => {
		beforeEach( () => {
			vi.useFakeTimers();
		} );

		afterEach( () => {
			vi.useRealTimers();
		} );

		it( 'should not execute the specified `confirmationCallback` when re-publishing packages', async () => {
			vi.mocked( findPathsToPackages )
				// First execution.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-bar'
				] )
				// Check for failed packages.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-bar'
				] )
				// Repeat execution: look for packages to release.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-bar'
				] )
				// Check for failed packages.
				.mockResolvedValue( [] );

			vi.mocked( fs ).readJson.mockResolvedValue( {} );

			const confirmationCallback = vi.fn().mockReturnValue( true );
			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				confirmationCallback,
				listrTask: {}
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

			expect( confirmationCallback ).toHaveBeenCalledOnce();
		} );

		it( 'should execute itself once again after a timeout passes if some packages could not be published', async () => {
			vi.mocked( findPathsToPackages )
				// First execution.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-bar'
				] )
				// Check for failed packages.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-bar'
				] )
				// Repeat execution: look for packages to release.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-bar'
				] )
				// Check for failed packages.
				.mockResolvedValue( [] );

			vi.mocked( fs ).readJson.mockResolvedValue( {} );

			const dateBefore = new Date();

			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {}
			} );

			await vi.advanceTimersToNextTimerAsync();

			await promise;
			const dateAfter = new Date();

			expect( differenceInMilliseconds( dateAfter, dateBefore ) ).toEqual( 10000 );
		} );

		it( 'should inform a user about a timeout that hangs the process', async () => {
			vi.mocked( findPathsToPackages )
				// First execution.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-bar'
				] )
				// Check for failed packages.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-bar'
				] )
				// Repeat execution: look for packages to release.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-bar'
				] )
				// Check for failed packages.
				.mockResolvedValue( [] );

			vi.mocked( fs ).readJson.mockResolvedValue( {} );

			const listrTask = {
				output: ''
			};

			const confirmationCallback = vi.fn().mockReturnValue( true );
			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				confirmationCallback,
				listrTask
			} );

			await vi.advanceTimersByTimeAsync( 0 );
			expect( listrTask.output ).not.toEqual( '' );

			await vi.advanceTimersToNextTimerAsync();
			expect( listrTask.output ).toEqual( 'Done. Let\'s continue.' );

			await promise;
		} );

		it( 'should try to publish packages thrice before rejecting a promise', async () => {
			vi.mocked( findPathsToPackages )
				.mockResolvedValueOnce( [ '/work/project/packages/ckeditor5-bar' ] )
				.mockResolvedValueOnce( [ '/work/project/packages/ckeditor5-bar' ] )
				.mockResolvedValueOnce( [ '/work/project/packages/ckeditor5-bar' ] )
				.mockResolvedValueOnce( [ '/work/project/packages/ckeditor5-bar' ] )
				.mockResolvedValueOnce( [ '/work/project/packages/ckeditor5-bar' ] )
				.mockResolvedValue( [] );

			vi.mocked( fs ).readJson.mockResolvedValue( {} );

			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {}
			} );

			// Needed twice because the third attempt does not setup a timeout.
			await vi.advanceTimersToNextTimerAsync();
			await vi.advanceTimersToNextTimerAsync();
			await promise;

			expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'should execute itself and publish the non-published packages again (integration)', async () => {
			vi.mocked( findPathsToPackages )
				// First execution.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] )
				// Check for failed packages.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] )
				// Repeat execution: look for packages to release.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] )
				// Repeat execution: Check for failed packages.
				.mockResolvedValue( [] );

			vi.mocked( fs ).readJson.mockImplementation( input => {
				return Promise.resolve( {
					name: '@ckeditor/' + input.split( '/' ).at( -1 ),
					version: '1.0.0'
				} );
			} );

			vi.mocked( checkVersionAvailability )
				// @ckeditor/ckeditor5-foo
				.mockResolvedValueOnce( true )
				// @ckeditor/ckeditor5-bar
				.mockResolvedValueOnce( true )
				// @ckeditor/ckeditor5-foo
				// Simulate a package was published but npm returned an error while uploading.
				.mockResolvedValueOnce( false )
				// @ckeditor/ckeditor5-bar
				.mockResolvedValueOnce( true );

			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {}
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

			expect( vi.mocked( fs ).remove ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).remove ).toHaveBeenCalledWith( '/work/project/packages/ckeditor5-foo' );

			expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( findPathsToPackages ) ).toHaveBeenCalledTimes( 4 );
		} );

		it( 'should reject a promise if cannot publish packages and there is no more attempting', async () => {
			vi.mocked( findPathsToPackages ).mockResolvedValue( [ '/work/project/packages/ckeditor5-bar' ] );

			vi.mocked( fs ).readJson.mockResolvedValue( {
				name: '@ckeditor/ckeditor5-bar',
				version: '1.0.0'
			} );

			await expect( publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				attempts: 1
			} ) ).rejects.toThrow( 'Some packages could not be published.' );
		} );

		it( 'should reject a promise if cannot publish packages and there is no more attempting (a negative attempts value)', async () => {
			vi.mocked( findPathsToPackages ).mockResolvedValue( [ '/work/project/packages/ckeditor5-bar' ] );

			vi.mocked( fs ).readJson.mockResolvedValue( {
				name: '@ckeditor/ckeditor5-bar',
				version: '1.0.0'
			} );

			await expect( publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				attempts: -5
			} ) ).rejects.toThrow( 'Some packages could not be published.' );
		} );
	} );
} );
