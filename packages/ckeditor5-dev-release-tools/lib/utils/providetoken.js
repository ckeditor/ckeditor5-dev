/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import inquirer from 'inquirer';

/**
 * Asks a user for providing the GitHub token.
 *
 * @returns {Promise.<String>}
 */
export default async function provideToken() {
	const tokenQuestion = {
		type: 'password',
		name: 'token',
		message: 'Provide the GitHub token:',
		validate( input ) {
			return input.length === 40 ? true : 'Please provide a valid token.';
		}
	};

	const { token } = await inquirer.prompt( [ tokenQuestion ] );

	return token;
}
