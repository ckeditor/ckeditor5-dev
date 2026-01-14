/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import inquirer from 'inquirer';
import confirmIncludingPackage from '../../lib/utils/confirmincludingpackage.js';

vi.mock( 'inquirer' );

describe( 'confirmIncludingPackage()', () => {
	it( 'user can disagree with the proposed value', async () => {
		vi.mocked( inquirer ).prompt.mockResolvedValue( {
			confirm: true
		} );

		await expect( confirmIncludingPackage() ).resolves.toBe( true );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					name: 'confirm',
					type: 'confirm',
					message: expect.stringContaining( 'Package does not contain all required files to publish.' ),
					default: expect.any( Boolean )
				} )
			] )
		);
	} );
} );
