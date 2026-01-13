/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, type Mock } from 'vitest';
import checkVersionAvailability from '../../src/npm/checkversionavailability.js';
import { manifest } from '../../src/npm/pacotecacheless.js';

vi.mock( '../../src/npm/pacotecacheless.js' );

describe( 'checkVersionAvailability()', () => {
	it( 'should resolve to true if version does not exist', async () => {
		vi.mocked( manifest ).mockRejectedValue( 'E404' );

		await expect( checkVersionAvailability( '1.0.1', 'stub-package' ) ).resolves.toBe( true );

		expect( manifest ).toHaveBeenCalledExactlyOnceWith( 'stub-package@1.0.1' );
	} );

	it( 'should resolve to false if version exists', async () => {
		( manifest as Mock ).mockResolvedValue( '1.0.1' );

		await expect( checkVersionAvailability( '1.0.1', 'stub-package' ) ).resolves.toBe( false );
	} );
} );
