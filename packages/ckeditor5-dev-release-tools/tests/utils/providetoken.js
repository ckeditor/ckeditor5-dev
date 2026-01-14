/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import inquirer from 'inquirer';
import provideToken from '../../lib/utils/providetoken.js';

vi.mock( 'inquirer' );

describe( 'provideToken()', () => {
	beforeEach( () => {
		vi.mocked( inquirer ).prompt.mockResolvedValue( { token: 'MyPassword' } );
	} );

	it( 'user is able to provide the token', async () => {
		await expect( provideToken() ).resolves.toEqual( 'MyPassword' );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					name: 'token',
					type: 'password',
					message: 'Provide the GitHub token:'
				} )
			] )
		);
	} );

	it( 'token must contain 40 characters', async () => {
		await provideToken();

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					validate: expect.any( Function )
				} )
			] )
		);

		const [ firstCall ] = vi.mocked( inquirer ).prompt.mock.calls;
		const [ firstArgument ] = firstCall;
		const [ firstQuestion ] = firstArgument;
		const { validate } = firstQuestion;

		expect( validate( 'abc' ) ).to.equal( 'Please provide a valid token.' );
		expect( validate( 'a'.repeat( 40 ) ) ).to.equal( true );
	} );
} );
