/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import inquirer from 'inquirer';
import validateGithubToken from './validategithubtoken.js';

/**
 * Asks a user for providing the GitHub token.
 *
 * @param {object} [options]
 * @param {string} [options.cwd=process.cwd()] Current working directory from which the repository will be resolved.
 * @returns {Promise.<string>}
 */
export default async function provideToken( options ) {
	const tokenQuestion = {
		type: 'password',
		name: 'token',
		message: 'Provide the GitHub token:',
		async validate( input ) {
			try {
				await validateGithubToken( input, options );

				return true;
			} catch ( error ) {
				return error.message;
			}
		}
	};

	const { token } = await inquirer.prompt( [ tokenQuestion ] );

	return token.trim();
}
