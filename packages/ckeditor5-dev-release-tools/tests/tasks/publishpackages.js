/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import { workspaces, npm } from '@ckeditor/ckeditor5-dev-utils';
import { differenceInMilliseconds } from 'date-fns';
import assertNpmAuthorization from '../../lib/utils/assertnpmauthorization.js';
import assertPackages from '../../lib/utils/assertpackages.js';
import assertNpmTag from '../../lib/utils/assertnpmtag.js';
import assertFilesToPublish from '../../lib/utils/assertfilestopublish.js';
import executeInParallel from '../../lib/utils/executeinparallel.js';
import publishPackageOnNpmCallback from '../../lib/utils/publishpackageonnpmcallback.js';
import publishPackages from '../../lib/tasks/publishpackages.js';

vi.mock( 'fs/promises' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( '../../lib/utils/assertnpmauthorization.js' );
vi.mock( '../../lib/utils/assertpackages.js' );
vi.mock( '../../lib/utils/assertnpmtag.js' );
vi.mock( '../../lib/utils/assertfilestopublish.js' );
vi.mock( '../../lib/utils/executeinparallel.js' );
vi.mock( '../../lib/utils/publishpackageonnpmcallback.js' );

describe( 'publishPackages()', () => {
	beforeEach( () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/work/project' );

		vi.mocked( workspaces.findPathsToPackages )
			.mockResolvedValueOnce( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] )
			.mockResolvedValueOnce( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] )
			.mockResolvedValue( [] );

		vi.mocked( assertNpmAuthorization ).mockResolvedValue();
		vi.mocked( assertPackages ).mockResolvedValue();
		vi.mocked( assertNpmTag ).mockResolvedValue();
		vi.mocked( assertFilesToPublish ).mockResolvedValue();
		vi.mocked( executeInParallel ).mockResolvedValue();
		vi.mocked( publishPackageOnNpmCallback ).mockResolvedValue();

		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( { name: '', version: '' } ) );
		vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( true );

		vi.useFakeTimers();
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	describe( 'a package verification', () => {
		it( 'should not throw if all assertion passes', async () => {
			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {}
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;
		} );

		it( 'should read the package directory (default `cwd`)', async () => {
			vi.mocked( workspaces.findPathsToPackages ).mockReset().mockResolvedValue( [] );

			await publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {}
			} );

			expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledWith( '/work/project', 'packages' );
		} );

		it( 'should read the package directory (custom `cwd`)', async () => {
			vi.mocked( workspaces.findPathsToPackages ).mockReset().mockResolvedValue( [] );

			await publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {},
				cwd: '/work/custom-dir'
			} );

			expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledWith( '/work/custom-dir', 'packages' );
		} );

		it( 'should assert npm authorization', async () => {
			vi.mocked( workspaces.findPathsToPackages ).mockReset().mockResolvedValue( [] );

			await publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {}
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

			expect( vi.mocked( assertNpmAuthorization ) ).toHaveBeenCalledExactlyOnceWith( 'fake-pepe' );
		} );

		it( 'should assert that each found directory is a package', async () => {
			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {}
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

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
			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {},
				requireEntryPoint: true,
				optionalEntryPointPackages: [
					'ckeditor5-foo'
				]
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

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
			vi.mocked( workspaces.findPathsToPackages )
				.mockResolvedValue( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] );

			vi.mocked( assertPackages ).mockRejectedValue(
				new Error( 'The "package.json" file is missing in the "ckeditor5-foo" package.' )
			);

			await expect( publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {}
			} ) ).rejects.toThrow( 'The "package.json" file is missing in the "ckeditor5-foo" package.' );
		} );

		it( 'should assert that each required file exists in the package directory (no optional entries)', async () => {
			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {}
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

			expect( vi.mocked( assertFilesToPublish ) ).toHaveBeenCalledExactlyOnceWith(
				[
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				],
				null
			);
		} );

		it( 'should assert that each required file exists in the package directory (with optional entries)', async () => {
			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {},
				optionalEntries: {
					'ckeditor5-foo': [ 'src' ]
				}
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

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
				npmOwner: 'pepe',
				listrTask: {}
			} ) ).rejects.toThrow( 'Missing files in "ckeditor5-foo" package for entries: "src"' );
		} );

		it( 'should assert that version tag matches the npm tag (default npm tag)', async () => {
			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {}
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

			expect( vi.mocked( assertNpmTag ) ).toHaveBeenCalledExactlyOnceWith(
				[
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				],
				'staging'
			);
		} );

		it( 'should assert that version tag matches the npm tag (custom npm tag)', async () => {
			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {},
				npmTag: 'nightly'
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

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
				npmOwner: 'pepe',
				listrTask: {}
			} ) ).rejects.toThrow( 'The version tag "rc" from "ckeditor5-foo" package does not match the npm tag "staging".' );
		} );
	} );

	describe( 'publishing packages', () => {
		it( 'should use two threads by default when publishing packages', async () => {
			const promise = publishPackages( {
				listrTask: {}
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

			expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
				concurrency: 2
			} ) );
		} );

		it( 'should pass parameters for publishing packages', async () => {
			const listrTask = {};
			const abortController = new AbortController();

			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				npmTag: 'nightly',
				listrTask,
				signal: abortController.signal,
				concurrency: 3,
				cwd: '/home/cwd'
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

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

			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

			expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledOnce();
		} );

		it( 'should publish packages on npm if synchronous confirmation callback returns truthy value', async () => {
			const confirmationCallback = vi.fn().mockReturnValue( true );
			const listrTask = {};

			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				confirmationCallback,
				listrTask
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

			expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledOnce();
		} );

		it( 'should publish packages on npm if asynchronous confirmation callback returns truthy value', async () => {
			const confirmationCallback = vi.fn().mockResolvedValue( true );
			const listrTask = {};

			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				confirmationCallback,
				listrTask
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

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
			vi.mocked( workspaces.findPathsToPackages )
				.mockReset()
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] )
				.mockResolvedValue( [] );

			vi.mocked( fs ).readFile
				.mockResolvedValueOnce( JSON.stringify( { name: '@ckeditor/ckeditor5-foo', version: '1.0.0' } ) )
				.mockResolvedValueOnce( JSON.stringify( { name: '@ckeditor/ckeditor5-bar', version: '1.0.0' } ) );

			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {}
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

			expect( vi.mocked( fs ).readFile ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( fs ).readFile ).toHaveBeenCalledWith( '/work/project/packages/ckeditor5-foo/package.json', 'utf-8' );
			expect( vi.mocked( fs ).readFile ).toHaveBeenCalledWith( '/work/project/packages/ckeditor5-bar/package.json', 'utf-8' );

			expect( vi.mocked( npm.checkVersionAvailability ) ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( npm.checkVersionAvailability ) ).toHaveBeenCalledWith( '1.0.0', '@ckeditor/ckeditor5-foo' );
			expect( vi.mocked( npm.checkVersionAvailability ) ).toHaveBeenCalledWith( '1.0.0', '@ckeditor/ckeditor5-bar' );
		} );

		it( 'should remove a package if is already published', async () => {
			vi.mocked( workspaces.findPathsToPackages )
				.mockReset()
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] )
				.mockResolvedValue( [] );

			vi.mocked( fs ).readFile
				.mockResolvedValueOnce( JSON.stringify( { name: '@ckeditor/ckeditor5-foo', version: '1.0.0' } ) )
				.mockResolvedValueOnce( JSON.stringify( { name: '@ckeditor/ckeditor5-bar', version: '1.0.0' } ) );

			vi.mocked( npm.checkVersionAvailability )
				.mockResolvedValueOnce( false )
				.mockResolvedValueOnce( true );

			await publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask: {}
			} );

			expect( vi.mocked( fs ).rm ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).rm ).toHaveBeenCalledWith( '/work/project/packages/ckeditor5-foo', expect.any( Object ) );
		} );
	} );

	describe( 're-publish packages that could not be published', () => {
		beforeEach( () => {
			vi.mocked( workspaces.findPathsToPackages ).mockReset();
		} );

		it( 'should not execute the specified `confirmationCallback` when re-publishing packages', async () => {
			vi.mocked( workspaces.findPathsToPackages )
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

			vi.mocked( fs ).readFile.mockResolvedValue( '{}' );

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
			vi.mocked( workspaces.findPathsToPackages )
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

			vi.mocked( fs ).readFile.mockResolvedValue( '{}' );

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
			vi.mocked( workspaces.findPathsToPackages )
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

			vi.mocked( fs ).readFile.mockResolvedValue( '{}' );

			const messages = [];
			const listrTask = {
				set output( value ) {
					messages.push( value );
				}
			};

			const confirmationCallback = vi.fn().mockReturnValue( true );
			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				confirmationCallback,
				listrTask
			} );

			await vi.advanceTimersToNextTimerAsync();
			await promise;

			expect( messages[ 0 ] ).toEqual( 'Let\'s give an npm a moment for taking a breath (~10 sec)...' );
			expect( messages[ 1 ] ).toEqual( 'Done. Let\'s continue. Re-executing.' );
		} );

		it( 'should try to publish packages five times before rejecting a promise', async () => {
			// We want to simulate that the last call published the package. The previous attempts had failed.
			for ( let i = 0; i < 5; ++i ) {
				vi.mocked( workspaces.findPathsToPackages )
					.mockResolvedValueOnce( [ '/work/project/packages/ckeditor5-bar' ] )
					.mockResolvedValueOnce( [ '/work/project/packages/ckeditor5-bar' ] );
			}

			// The last call before throwing an error. After comparing results with the registry,
			// there is nothing to publish.
			vi.mocked( workspaces.findPathsToPackages )
				.mockResolvedValueOnce( [ '/work/project/packages/ckeditor5-bar' ] )
				.mockResolvedValue( [] );

			vi.mocked( fs ).readFile.mockResolvedValue( '{}' );

			const listrTask = {
				output: ''
			};

			const promise = publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				listrTask
			} );

			// Each execution sets its own timer.
			for ( let i = 0; i < 5; ++i ) {
				await vi.advanceTimersToNextTimerAsync();
			}

			await promise;

			expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledTimes( 5 );
			expect( listrTask.output ).toEqual( 'All packages have been published.' );
		} );

		it( 'should execute itself and publish the non-published packages again (integration)', async () => {
			vi.mocked( workspaces.findPathsToPackages )
				// First execution.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] )
				// All packages must be published.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] )
				// Repeat execution: look for packages to release.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] )
				// Check for failed packages.
				.mockResolvedValueOnce( [
					'/work/project/packages/ckeditor5-foo'
				] )
				// Repeat execution: look for packages to release.
				.mockResolvedValue( [] );

			vi.mocked( fs ).readFile.mockImplementation( input => {
				return Promise.resolve( JSON.stringify( {
					name: '@ckeditor/' + input.split( '/' ).at( -1 ),
					version: '1.0.0'
				} ) );
			} );

			vi.mocked( npm.checkVersionAvailability )
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
			await vi.advanceTimersToNextTimerAsync();
			await promise;

			expect( vi.mocked( fs ).rm ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).rm ).toHaveBeenCalledWith( '/work/project/packages/ckeditor5-foo', expect.any( Object ) );

			expect( vi.mocked( executeInParallel ) ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledTimes( 6 );
		} );

		it( 'should reject a promise if cannot publish packages and there are no more attempts', async () => {
			vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [ '/work/project/packages/ckeditor5-bar' ] );

			vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
				name: '@ckeditor/ckeditor5-bar',
				version: '1.0.0'
			} ) );

			const promise = safeReject( publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				attempts: 1,
				listrTask: {}
			} ) );

			await vi.advanceTimersToNextTimerAsync();

			await expect( promise ).rejects.toThrow( 'Some packages could not be published.' );

			expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledTimes( 4 );
		} );

		it( 'should reject a promise if cannot publish packages and there is no more attempting (a negative attempts value)', async () => {
			vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [ '/work/project/packages/ckeditor5-bar' ] );

			vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
				name: '@ckeditor/ckeditor5-bar',
				version: '1.0.0'
			} ) );

			await expect( publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				attempts: -5
			} ) ).rejects.toThrow( 'Some packages could not be published.' );

			expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledTimes( 2 );
		} );
	} );
} );

// To mute the "PromiseRejectionHandledWarning" warning.
function safeReject( promise ) {
	promise.catch( vi.fn() );

	return promise;
}
