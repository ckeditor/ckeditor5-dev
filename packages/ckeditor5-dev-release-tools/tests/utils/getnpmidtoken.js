/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { execFile } from 'node:child_process';
import getNpmIdToken, { NPM_OIDC_AUDIENCE } from '../../lib/utils/getnpmidtoken.js';

vi.mock( 'node:child_process' );

describe( 'getNpmIdToken()', () => {
	beforeEach( () => {
		vi.stubEnv( 'CIRCLECI', '' );
		vi.stubEnv( 'NPM_ID_TOKEN', '' );
	} );

	it( 'should use the npm registry audience', () => {
		expect( NPM_OIDC_AUDIENCE ).toEqual( 'npm:registry.npmjs.org' );
	} );

	describe( 'on CircleCI', () => {
		beforeEach( () => {
			vi.stubEnv( 'CIRCLECI', 'true' );
		} );

		it( 'should request a fresh OIDC token with the npm audience', async () => {
			vi.mocked( execFile ).mockImplementation( ( file, args, callback ) => callback( null, 'fresh-token\n' ) );

			await expect( getNpmIdToken() ).resolves.toEqual( 'fresh-token' );

			expect( execFile ).toHaveBeenCalledExactlyOnceWith(
				'circleci',
				[ 'run', 'oidc', 'get', '--claims', '{"aud":"npm:registry.npmjs.org"}' ],
				expect.any( Function )
			);
		} );

		it( 'should request a new token on each call instead of using the "NPM_ID_TOKEN" environment variable', async () => {
			vi.stubEnv( 'NPM_ID_TOKEN', 'old-token' );
			vi.mocked( execFile ).mockImplementation( ( file, args, callback ) => callback( null, 'fresh-token' ) );

			await getNpmIdToken();
			await expect( getNpmIdToken() ).resolves.toEqual( 'fresh-token' );

			expect( execFile ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should throw when the CircleCI CLI returns an empty token', async () => {
			vi.mocked( execFile ).mockImplementation( ( file, args, callback ) => callback( null, '  \n' ) );

			await expect( getNpmIdToken() ).rejects.toThrow( 'The `circleci run oidc get` command returned an empty OIDC token.' );
		} );

		it( 'should pass an error from the CircleCI CLI', async () => {
			vi.mocked( execFile ).mockImplementation( ( file, args, callback ) => callback( new Error( 'circleci: not found' ) ) );

			await expect( getNpmIdToken() ).rejects.toThrow( 'circleci: not found' );
		} );
	} );

	describe( 'outside CircleCI', () => {
		it( 'should use the "NPM_ID_TOKEN" environment variable', async () => {
			vi.stubEnv( 'NPM_ID_TOKEN', 'env-token' );

			await expect( getNpmIdToken() ).resolves.toEqual( 'env-token' );

			expect( execFile ).not.toHaveBeenCalled();
		} );

		it( 'should throw when the "NPM_ID_TOKEN" environment variable is not set', async () => {
			await expect( getNpmIdToken() ).rejects.toThrow( 'Cannot get an OIDC token for npm Trusted Publishing (OIDC).' );
		} );
	} );
} );
