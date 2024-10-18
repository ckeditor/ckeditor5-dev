/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import pacote from 'pacote';
import checkVersionAvailability from '../../lib/utils/checkversionavailability.js';

vi.mock( 'pacote' );

describe( 'checkVersionAvailability()', () => {
	it( 'should resolve to true if version does not exist', async () => {
		vi.mocked( pacote.manifest ).mockRejectedValue( 'E404' );

		await expect( checkVersionAvailability( '1.0.1', 'stub-package' ) ).resolves.toBe( true );

		expect( pacote.manifest ).toHaveBeenCalledExactlyOnceWith( 'stub-package@1.0.1' );
	} );
	it( 'should resolve to false if version exists', async () => {
		pacote.manifest.mockResolvedValue( '1.0.1' );

		await expect( checkVersionAvailability( '1.0.1', 'stub-package' ) ).resolves.toBe( false );
	} );
} );
