/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import publishPackageOnNpmCallback from '../../lib/utils/publishpackageonnpmcallback.js';
import getNpmIdToken from '../../lib/utils/getnpmidtoken.js';

vi.mock( 'node:fs/promises' );
vi.mock( 'node:child_process' );
vi.mock( '../../lib/utils/getnpmidtoken.js' );

const PACKAGE_PATH = '/workspace/ckeditor5/packages/ckeditor5-foo';

describe( 'publishPackageOnNpmCallback()', () => {
	beforeEach( () => {
		vi.mocked( execFile ).mockImplementation( ( file, args, options, callback ) => callback( null, '', '' ) );
		vi.mocked( fs.rm ).mockResolvedValue();
	} );

	it( 'should publish package on npm with provided npm tag', async () => {
		await publishPackageOnNpmCallback( PACKAGE_PATH, { npmTag: 'nightly' } );

		expect( execFile ).toHaveBeenCalledExactlyOnceWith(
			'npm',
			[ 'publish', '--access=public', '--tag', 'nightly' ],
			expect.objectContaining( { cwd: PACKAGE_PATH } ),
			expect.any( Function )
		);
	} );

	it( 'should pass the npm tag as a separate argument without using a shell', async () => {
		await publishPackageOnNpmCallback( PACKAGE_PATH, { npmTag: 'next; rm -rf /' } );

		const [ , args, options ] = vi.mocked( execFile ).mock.calls[ 0 ];

		expect( args ).toEqual( [ 'publish', '--access=public', '--tag', 'next; rm -rf /' ] );
		expect( options ).not.toHaveProperty( 'shell' );
	} );

	it( 'should remove package directory after publishing on npm', async () => {
		await publishPackageOnNpmCallback( PACKAGE_PATH, { npmTag: 'nightly' } );

		expect( fs.rm ).toHaveBeenCalledExactlyOnceWith( PACKAGE_PATH, { recursive: true, force: true } );
	} );

	it( 'should not remove a package directory and not throw error when publishing on npm failed with code 409', async () => {
		vi.mocked( execFile ).mockImplementation( ( file, args, options, callback ) => callback( new Error( 'code E409' ) ) );

		await expect( publishPackageOnNpmCallback( PACKAGE_PATH, { npmTag: 'nightly' } ) ).resolves.toBeUndefined();

		expect( fs.rm ).not.toHaveBeenCalled();
	} );

	it( 'should pass the current environment to npm when not using OIDC', async () => {
		await publishPackageOnNpmCallback( PACKAGE_PATH, { npmTag: 'nightly' } );

		const [ , , options ] = vi.mocked( execFile ).mock.calls[ 0 ];

		expect( options.env ).toBe( process.env );
		expect( getNpmIdToken ).not.toHaveBeenCalled();
	} );

	describe( 'npm Trusted Publishing (`useOidc=true`)', () => {
		it( 'should pass a fresh OIDC token only to the npm process', async () => {
			vi.stubEnv( 'NPM_ID_TOKEN', 'old-token' );
			vi.mocked( getNpmIdToken ).mockResolvedValue( 'fresh-token' );

			await publishPackageOnNpmCallback( PACKAGE_PATH, { npmTag: 'nightly', useOidc: true } );

			const [ , , options ] = vi.mocked( execFile ).mock.calls[ 0 ];

			expect( getNpmIdToken ).toHaveBeenCalledOnce();
			expect( options.env ).toEqual( expect.objectContaining( { NPM_ID_TOKEN: 'fresh-token' } ) );
			expect( process.env.NPM_ID_TOKEN ).toEqual( 'old-token' );
		} );

		it( 'should not publish the package when an OIDC token cannot be requested', async () => {
			vi.mocked( getNpmIdToken ).mockRejectedValue( new Error( 'circleci: not found' ) );

			await expect( publishPackageOnNpmCallback( PACKAGE_PATH, { npmTag: 'nightly', useOidc: true } ) ).resolves.toBeUndefined();

			expect( execFile ).not.toHaveBeenCalled();
			expect( fs.rm ).not.toHaveBeenCalled();
		} );
	} );
} );
