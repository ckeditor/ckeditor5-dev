/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import inquirer from 'inquirer';
import provideToken from '../../lib/utils/providetoken.js';
import validateGithubToken from '../../lib/utils/validategithubtoken.js';

vi.mock( 'inquirer' );
vi.mock( '../../lib/utils/validategithubtoken.js' );

describe( 'provideToken()', () => {
	beforeEach( () => {
		vi.mocked( inquirer ).prompt.mockResolvedValue( { token: '  MyPassword  ' } );
		vi.mocked( validateGithubToken ).mockResolvedValue( 'MyPassword' );
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

	it( 'validates the token using GitHub', async () => {
		await provideToken( { cwd: '/workspace' } );

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

		await expect( validate( 'github-token' ) ).resolves.toBe( true );

		expect( validateGithubToken ).toHaveBeenCalledExactlyOnceWith( 'github-token', { cwd: '/workspace' } );
	} );

	it( 'shows a validation error returned by GitHub', async () => {
		vi.mocked( validateGithubToken ).mockRejectedValue( new Error( 'GitHub API request failed with HTTP 401: Bad credentials' ) );

		await provideToken();

		const [ firstCall ] = vi.mocked( inquirer ).prompt.mock.calls;
		const [ firstArgument ] = firstCall;
		const [ firstQuestion ] = firstArgument;

		await expect( firstQuestion.validate( 'github-token' ) )
			.resolves.toBe( 'GitHub API request failed with HTTP 401: Bad credentials' );
	} );
} );
