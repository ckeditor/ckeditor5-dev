/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import columns from 'cli-columns';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import shellEscape from 'shell-escape';
import assertNpmAuthorization from '../../lib/utils/assertnpmauthorization.js';
import getNpmIdToken from '../../lib/utils/getnpmidtoken.js';
import removeNpmTags from '../../lib/tasks/removenpmtags.js';

const stubs = vi.hoisted( () => {
	const values = {
		spinner: {
			start: vi.fn(),
			increase: vi.fn(),
			finish: vi.fn()
		},
		exec: vi.fn(),
		styleText: vi.fn( ( _style, text ) => text )
	};

	return values;
} );

vi.stubGlobal( 'console', {
	log: vi.fn(),
	warn: vi.fn(),
	error: vi.fn()
} );

vi.mock( '@ckeditor/ckeditor5-dev-utils', () => ( {
	tools: {
		createSpinner: vi.fn( () => stubs.spinner )
	}
} ) );
vi.mock( 'node:util', () => ( {
	styleText: stubs.styleText,
	promisify: vi.fn( () => stubs.exec )
} ) );
vi.mock( 'shell-escape' );
vi.mock( 'cli-columns' );
vi.mock( '../../lib/utils/assertnpmauthorization.js' );
vi.mock( '../../lib/utils/getnpmidtoken.js' );

describe( 'removeNpmTags()', () => {
	beforeEach( () => {
		vi.mocked( shellEscape ).mockImplementation( v => v[ 0 ] );
		vi.mocked( assertNpmAuthorization ).mockResolvedValue( true );
		stubs.exec.mockResolvedValue( { stdout: '-staging-v1.0.1: package1@1.0.1' } );
	} );

	/**
	 * Mocks `npm dist-tag rm` results per package. The calls run in parallel and failed calls are retried,
	 * so results cannot be queued in the call order.
	 *
	 * @param {Object.<string, string|Error>} results
	 */
	function mockExecPerPackage( results ) {
		stubs.exec.mockImplementation( command => {
			const packageName = command.match( /npm dist-tag rm (\S+) / )[ 1 ];
			const result = results[ packageName ];

			if ( result instanceof Error ) {
				return Promise.reject( result );
			}

			return Promise.resolve( { stdout: result } );
		} );
	}

	it( 'should throw an error when the npm tag is not specified', async () => {
		await expect( removeNpmTags( { npmOwner: 'authorized-user', packages: [ 'package1' ] } ) )
			.rejects.toThrow( 'The "npmTag" option is required.' );

		expect( assertNpmAuthorization ).not.toHaveBeenCalled();
		expect( stubs.exec ).not.toHaveBeenCalled();
	} );

	it( 'should throw an error when assertNpmAuthorization throws error', async () => {
		vi.mocked( assertNpmAuthorization ).mockRejectedValue( new Error( 'User not logged in error' ) );

		await expect( removeNpmTags( { npmOwner: 'correct-npm-user', packages: [ 'package1' ], npmTag: 'staging-v1.0.1' } ) )
			.rejects.toThrow( 'User not logged in error' );

		expect( stubs.exec ).not.toHaveBeenCalled();
	} );

	it( 'should remove the tag from each package', async () => {
		await removeNpmTags( { npmOwner: 'authorized-user', packages: [ 'package1', 'package2' ], npmTag: 'staging-v1.0.1' } );

		expect( assertNpmAuthorization ).toHaveBeenCalledExactlyOnceWith( 'authorized-user', { useOidc: false } );
		expect( stubs.exec ).toHaveBeenCalledTimes( 2 );
		expect( stubs.exec ).toHaveBeenCalledWith( 'npm dist-tag rm package1 staging-v1.0.1' );
		expect( stubs.exec ).toHaveBeenCalledWith( 'npm dist-tag rm package2 staging-v1.0.1' );
	} );

	it( 'should escape arguments passed to a shell command', async () => {
		await removeNpmTags( { npmOwner: 'authorized-user', packages: [ 'package1' ], npmTag: 'staging-v1.0.1' } );

		expect( shellEscape ).toHaveBeenCalledWith( [ 'package1' ] );
		expect( shellEscape ).toHaveBeenCalledWith( [ 'staging-v1.0.1' ] );
	} );

	it( 'should pass a fresh OIDC token only to the npm process when using OIDC', async () => {
		vi.mocked( getNpmIdToken )
			.mockResolvedValueOnce( 'token-1' )
			.mockResolvedValueOnce( 'token-2' );

		await removeNpmTags( { useOidc: true, packages: [ 'package1', 'package2' ], npmTag: 'staging-v1.0.1' } );

		expect( assertNpmAuthorization ).toHaveBeenCalledExactlyOnceWith( undefined, { useOidc: true } );
		expect( stubs.exec ).toHaveBeenCalledWith(
			'npm dist-tag rm package1 staging-v1.0.1',
			{ env: expect.objectContaining( { NPM_ID_TOKEN: 'token-1' } ) }
		);
		expect( stubs.exec ).toHaveBeenCalledWith(
			'npm dist-tag rm package2 staging-v1.0.1',
			{ env: expect.objectContaining( { NPM_ID_TOKEN: 'token-2' } ) }
		);
	} );

	it( 'should resolve and report packages without the tag as skipped', async () => {
		mockExecPerPackage( {
			package1: '-staging-v1.0.1: package1@1.0.1',
			package2: new Error( 'npm error staging-v1.0.1 is not a dist-tag on package2' )
		} );
		vi.mocked( columns ).mockImplementation( packages => packages.join( ' | ' ) );

		await expect( removeNpmTags( { npmOwner: 'authorized-user', packages: [ 'package1', 'package2' ], npmTag: 'staging-v1.0.1' } ) )
			.resolves.toBeUndefined();

		expect( console.log ).toHaveBeenCalledWith( '✨ Tags removed:' );
		expect( console.log ).toHaveBeenCalledWith( 'package1' );
		expect( console.log ).toHaveBeenCalledWith( '⬇️ Packages skipped:' );
		expect( console.log ).toHaveBeenCalledWith( 'package2' );
	} );

	it( 'should report a package without any dist-tags as skipped', async () => {
		stubs.exec.mockRejectedValue( new Error( 'npm error No dist-tags found for package1' ) );

		await expect( removeNpmTags( { npmOwner: 'authorized-user', packages: [ 'package1' ], npmTag: 'staging-v1.0.1' } ) )
			.resolves.toBeUndefined();

		expect( console.log ).toHaveBeenCalledWith( '⬇️ Packages skipped:' );
		expect( console.log ).not.toHaveBeenCalledWith( '🐛 Errors found:' );
	} );

	it( 'should process all packages before rejecting and list only the failed ones in the error', async () => {
		mockExecPerPackage( {
			package1: new Error( 'E403 Forbidden' ),
			package2: '-staging-v1.0.1: package2@1.0.1',
			package3: new Error( 'E500 Internal Server Error' )
		} );

		await expect( removeNpmTags( {
			npmOwner: 'authorized-user',
			packages: [ 'package1', 'package2', 'package3' ],
			npmTag: 'staging-v1.0.1'
		} ) ).rejects.toThrow( 'Could not remove the "staging-v1.0.1" npm dist-tag from the following packages: package1, package3.' );

		expect( stubs.exec ).toHaveBeenCalledWith( 'npm dist-tag rm package2 staging-v1.0.1' );
		expect( console.log ).toHaveBeenCalledWith( '🐛 Errors found:' );
	} );

	it( 'should retry a failing package before reporting it as failed', async () => {
		stubs.exec.mockRejectedValue( new Error( 'E403 Forbidden' ) );

		await expect( removeNpmTags( { npmOwner: 'authorized-user', packages: [ 'package1' ], npmTag: 'staging-v1.0.1' } ) )
			.rejects.toThrow();

		// The initial call and 3 retries.
		expect( stubs.exec ).toHaveBeenCalledTimes( 4 );
	} );

	it( 'should use its own spinner title', async () => {
		await removeNpmTags( { npmOwner: 'authorized-user', packages: [], npmTag: 'staging-v1.0.1' } );

		expect( tools.createSpinner ).toHaveBeenCalledExactlyOnceWith( 'Removing npm tags...', { total: 0 } );
	} );
} );
