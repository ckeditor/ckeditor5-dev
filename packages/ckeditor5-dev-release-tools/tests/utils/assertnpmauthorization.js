/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import assertNpmAuthorization from '../../lib/utils/assertnpmauthorization.js';
import getNpmIdToken from '../../lib/utils/getnpmidtoken.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( '../../lib/utils/getnpmidtoken.js' );

describe( 'assertNpmAuthorization()', () => {
	it( 'should not throw if user is logged to npm as the provided account name', async () => {
		vi.mocked( tools ).shExec.mockResolvedValue( 'pepe' );

		await assertNpmAuthorization( 'pepe' );

		expect( vi.mocked( tools ).shExec ).toHaveBeenCalledExactlyOnceWith(
			'npm whoami',
			expect.objectContaining( {
				verbosity: 'error',
				async: true
			} )
		);
	} );

	it( 'should trim whitespace characters from the command output before checking the name', async () => {
		vi.mocked( tools ).shExec.mockResolvedValue( '\t pepe \n' );

		await assertNpmAuthorization( 'pepe' );
	} );

	it( 'should throw if user is not logged to npm', async () => {
		vi.mocked( tools ).shExec.mockRejectedValue( new Error( 'not logged' ) );

		await expect( assertNpmAuthorization( 'pepe' ) )
			.rejects.toThrow( 'You must be logged to npm as "pepe" to execute this release step.' );
	} );

	it( 'should throw if user is logged to npm on different account name', async () => {
		vi.mocked( tools ).shExec.mockResolvedValue( 'john' );

		await expect( assertNpmAuthorization( 'pepe' ) )
			.rejects.toThrow( 'You must be logged to npm as "pepe" to execute this release step.' );
	} );

	it( 'should verify the npm account when the `useOidc` option is disabled explicitly', async () => {
		vi.mocked( tools ).shExec.mockResolvedValue( 'pepe' );

		await assertNpmAuthorization( 'pepe', { useOidc: false } );

		expect( vi.mocked( tools ).shExec ).toHaveBeenCalledExactlyOnceWith( 'npm whoami', expect.any( Object ) );
	} );

	describe( 'npm Trusted Publishing (`useOidc=true`)', () => {
		it( 'should check that an OIDC token can be obtained instead of calling `npm whoami`', async () => {
			vi.mocked( getNpmIdToken ).mockResolvedValue( 'oidc-token' );

			await assertNpmAuthorization( undefined, { useOidc: true } );

			expect( getNpmIdToken ).toHaveBeenCalledOnce();
			expect( vi.mocked( tools ).shExec ).not.toHaveBeenCalled();
		} );

		it( 'should throw when an OIDC token cannot be obtained', async () => {
			vi.mocked( getNpmIdToken ).mockRejectedValue( new Error( 'Cannot get an OIDC token for npm Trusted Publishing (OIDC).' ) );

			await expect( assertNpmAuthorization( undefined, { useOidc: true } ) )
				.rejects.toThrow( 'Cannot get an OIDC token for npm Trusted Publishing (OIDC).' );

			expect( vi.mocked( tools ).shExec ).not.toHaveBeenCalled();
		} );

		it( 'should ignore the provided npm account name', async () => {
			vi.mocked( getNpmIdToken ).mockResolvedValue( 'oidc-token' );

			await assertNpmAuthorization( 'pepe', { useOidc: true } );

			expect( vi.mocked( tools ).shExec ).not.toHaveBeenCalled();
		} );
	} );
} );
