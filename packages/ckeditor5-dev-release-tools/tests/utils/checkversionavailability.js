/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import shellEscape from 'shell-escape';
import checkVersionAvailability from '../../lib/utils/checkversionavailability.js';

vi.mock( 'shell-escape' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'checkVersionAvailability()', () => {
	beforeEach( () => {
		vi.mocked( shellEscape ).mockImplementation( v => v[ 0 ] );
	} );

	it( 'should resolve to true if version does not exist (npm >= 8.13.0 && npm < 10.0.0)', async () => {
		vi.mocked( tools ).shExec.mockRejectedValue( new Error( 'npm ERR! code E404' ) );

		const result = await checkVersionAvailability( '1.0.1', 'stub-package' );

		expect( vi.mocked( tools ).shExec ).toHaveBeenCalledExactlyOnceWith( 'npm show stub-package@1.0.1 version', expect.any( Object ) );
		expect( result ).toBe( true );
	} );

	it( 'should resolve to true if version does not exist (npm >= 10.0.0)', async () => {
		vi.mocked( tools ).shExec.mockRejectedValue( new Error( 'npm error code E404' ) );

		const result = await checkVersionAvailability( '1.0.1', 'stub-package' );
		expect( vi.mocked( tools ).shExec ).toHaveBeenCalledExactlyOnceWith( 'npm show stub-package@1.0.1 version', expect.any( Object ) );
		expect( result ).toBe( true );
	} );

	it( 'should resolve to true if version does not exist (npm < 8.13.0)', async () => {
		vi.mocked( tools ).shExec.mockResolvedValue( '' );

		await expect( checkVersionAvailability( '1.0.1', 'stub-package' ) ).resolves.toBe( true );
	} );

	it( 'should resolve to false if version exists', async () => {
		vi.mocked( tools ).shExec.mockResolvedValue( '1.0.1' );

		await expect( checkVersionAvailability( '1.0.1', 'stub-package' ) ).resolves.toBe( false );
	} );

	it( 'should re-throw an error if unknown error occurred', async () => {
		vi.mocked( tools ).shExec.mockRejectedValue( new Error( 'Unknown error.' ) );

		await expect( checkVersionAvailability( '1.0.1', 'stub-package' ) )
			.rejects.toThrow( 'Unknown error.' );
	} );

	it( 'should escape arguments passed to a shell command', async () => {
		vi.mocked( tools ).shExec.mockRejectedValue( new Error( 'npm ERR! code E404' ) );

		await checkVersionAvailability( '1.0.1', 'stub-package' );
		expect( vi.mocked( shellEscape ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( shellEscape ) ).toHaveBeenCalledWith( [ 'stub-package' ] );
		expect( vi.mocked( shellEscape ) ).toHaveBeenCalledWith( [ '1.0.1' ] );
	} );
} );
