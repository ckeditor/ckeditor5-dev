/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import chalk from 'chalk';
import inquirer from 'inquirer';
import confirmNpmTag from '../../lib/utils/confirmnpmtag.js';

vi.mock( 'inquirer' );
vi.mock( 'chalk', () => ( {
	default: {
		magenta: vi.fn( input => input ),
		red: vi.fn( input => input )
	}
} ) );

describe( 'confirmNpmTag()', () => {
	it( 'should ask user if continue the release process when passing the same versions', async () => {
		vi.mocked( inquirer ).prompt.mockResolvedValue( {
			confirm: true
		} );

		await expect( confirmNpmTag( 'latest', 'latest' ) ).resolves.toBe( true );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					name: 'confirm',
					type: 'confirm',
					message: 'The next release bumps the "latest" version. Should it be published to npm as "latest"?',
					default: true
				} )
			] )
		);

		expect( vi.mocked( chalk ).magenta ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should ask user if continue the release process when passing different versions', async () => {
		vi.mocked( inquirer ).prompt.mockResolvedValue( {
			confirm: false
		} );

		await expect( confirmNpmTag( 'latest', 'alpha' ) ).resolves.toBe( false );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					name: 'confirm',
					type: 'confirm',
					message: 'The next release bumps the "latest" version. Should it be published to npm as "alpha"?',
					default: false
				} )
			] )
		);

		expect( vi.mocked( chalk ).red ).toHaveBeenCalledTimes( 2 );
	} );
} );
