/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import inquirer from 'inquirer';
import chalk from 'chalk';

/**
 * Asks a user for a confirmation for updating and tagging versions of the packages.
 *
 * @param {string} versionTag A version tag based on a package version specified in `package.json`.
 * @param {string} npmTag A tag typed by the user when using the release tools.
 * @returns {Promise.<boolean>}
 */
export default function confirmNpmTag( versionTag, npmTag ) {
	const areVersionsEqual = versionTag === npmTag;
	const color = areVersionsEqual ? chalk.magenta : chalk.red;

	// eslint-disable-next-line @stylistic/max-len
	const message = `The next release bumps the "${ color( versionTag ) }" version. Should it be published to npm as "${ color( npmTag ) }"?`;

	const confirmQuestion = {
		message,
		type: 'confirm',
		name: 'confirm',
		default: areVersionsEqual
	};

	return inquirer.prompt( [ confirmQuestion ] )
		.then( answers => answers.confirm );
}
