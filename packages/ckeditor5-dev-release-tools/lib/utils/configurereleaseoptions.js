/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import inquirer from 'inquirer';
import provideToken from './providetoken.js';

/**
 * Asks a user for selecting services where packages will be released.
 *
 * If the user choices a GitHub, required token also has to be provided.
 *
 * @returns {Promise.<object>}
 */
export default async function configureReleaseOptions() {
	const options = {};

	const servicesQuestion = {
		type: 'checkbox',
		name: 'services',
		message: 'Select services where packages will be released:',
		choices: [
			'npm',
			'GitHub'
		],
		default: [
			'npm',
			'GitHub'
		]
	};

	const answers = await inquirer.prompt( [ servicesQuestion ] );

	options.npm = answers.services.includes( 'npm' );
	options.github = answers.services.includes( 'GitHub' );

	if ( options.github ) {
		options.token = await provideToken();
	}

	return options;
}
