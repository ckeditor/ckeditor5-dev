/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, type Mock } from 'vitest';
import checkVersionAvailability from '../../src/npm/checkversionavailability.js';
import { manifest } from '../../src/npm/pacotecacheless.js';

vi.mock( '../../src/npm/pacotecacheless.js' );

describe( 'checkVersionAvailability()', () => {
	it( 'should resolve to true if the package exists but the version does not', async () => {
		vi.mocked( manifest ).mockRejectedValue( Object.assign( new Error( 'No matching version found' ), { code: 'ETARGET' } ) );

		await expect( checkVersionAvailability( '1.0.1', 'stub-package' ) ).resolves.toBe( true );

		expect( manifest ).toHaveBeenCalledExactlyOnceWith( 'stub-package@1.0.1' );
	} );

	it( 'should resolve to true if the package does not exist', async () => {
		vi.mocked( manifest ).mockRejectedValue( Object.assign( new Error( 'Not Found' ), { code: 'E404' } ) );

		await expect( checkVersionAvailability( '1.0.1', 'stub-package' ) ).resolves.toBe( true );
	} );

	it( 'should resolve to false if version exists', async () => {
		( manifest as Mock ).mockResolvedValue( '1.0.1' );

		await expect( checkVersionAvailability( '1.0.1', 'stub-package' ) ).resolves.toBe( false );
	} );

	it( 'should rethrow an error that does not tell whether the version exists', async () => {
		const error = Object.assign( new Error( 'connect ECONNREFUSED' ), { code: 'ECONNREFUSED' } );

		vi.mocked( manifest ).mockRejectedValue( error );

		await expect( checkVersionAvailability( '1.0.1', 'stub-package' ) ).rejects.toBe( error );
	} );
} );
