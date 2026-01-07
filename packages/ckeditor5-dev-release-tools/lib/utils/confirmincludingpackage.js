/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import inquirer from 'inquirer';

/**
 * Asks a user for a confirmation for including a package that does not contain all required files.
 *
 * @returns {Promise.<boolean>}
 */
export default async function confirmIncludingPackage() {
	const confirmQuestion = {
		message: 'Package does not contain all required files to publish. Include this package in the release and continue?',
		type: 'confirm',
		name: 'confirm',
		default: true
	};

	const { confirm } = await inquirer.prompt( [ confirmQuestion ] );

	return confirm;
}
