/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import inquirer from 'inquirer';
import provideToken from '../../lib/utils/providetoken.js';
import configureReleaseOptions from '../../lib/utils/configurereleaseoptions.js';

vi.mock( 'inquirer' );
vi.mock( '../../lib/utils/providetoken.js' );

describe( 'configureReleaseOptions()', () => {
	it( 'returns npm and Github services and asks for a GitHub token', async () => {
		vi.mocked( inquirer ).prompt.mockResolvedValue( {
			services: [ 'npm', 'GitHub' ]
		} );
		vi.mocked( provideToken ).mockReturnValue( 'a'.repeat( 40 ) );

		const options = await configureReleaseOptions();

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					name: 'services',
					type: 'checkbox',
					message: 'Select services where packages will be released:',
					choices: expect.any( Array ),
					default: expect.any( Array )
				} )
			] )
		);

		expect( vi.mocked( provideToken ) ).toHaveBeenCalledOnce();

		expect( options ).toStrictEqual( {
			npm: true,
			github: true,
			token: 'a'.repeat( 40 )
		} );
	} );

	it( 'should not ask about a GitHub token if processing an npm release only', async () => {
		vi.mocked( inquirer ).prompt.mockResolvedValue( {
			services: [ 'npm' ]
		} );

		await configureReleaseOptions();
		expect( vi.mocked( provideToken ) ).not.toHaveBeenCalledOnce();
	} );
} );
