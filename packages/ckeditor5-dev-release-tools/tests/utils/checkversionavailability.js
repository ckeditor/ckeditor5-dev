/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import checkVersionAvailability from '../../lib/utils/checkversionavailability.js';
import { manifest } from '../../lib/utils/pacotecacheless.js';

vi.mock( '../../lib/utils/pacotecacheless.js' );

describe( 'checkVersionAvailability()', () => {
	it( 'should resolve to true if version does not exist', async () => {
		vi.mocked( manifest ).mockRejectedValue( 'E404' );

		await expect( checkVersionAvailability( '1.0.1', 'stub-package' ) ).resolves.toBe( true );

		expect( manifest ).toHaveBeenCalledExactlyOnceWith( 'stub-package@1.0.1' );
	} );
	it( 'should resolve to false if version exists', async () => {
		manifest.mockResolvedValue( '1.0.1' );

		await expect( checkVersionAvailability( '1.0.1', 'stub-package' ) ).resolves.toBe( false );
	} );
} );
