/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import inquirer from 'inquirer';
import semver from 'semver';
import chalk from 'chalk';
import { CLI_INDENT_SIZE } from './constants.js';
import { npm } from '@ckeditor/ckeditor5-dev-utils';

/**
 * Asks a user for providing the new version for a major release.
 *
 * @param {object} options
 * @param {string} options.packageName
 * @param {string} options.version
 * @param {string} options.bumpType
 * @param {number} [options.indentLevel=0] The indent level.
 * @returns {Promise.<string>}
 */
export default async function provideNewVersionForMonoRepository( options ) {
	const {
		version,
		packageName,
		bumpType,
		indentLevel = 0
	} = options;

	const suggestedVersion = semver.inc( version, bumpType );
	const message = 'Type the new version ' +
		`(current highest: "${ version }" found in "${ chalk.underline( packageName ) }", suggested: "${ suggestedVersion }"):`;

	const versionQuestion = {
		type: 'input',
		name: 'version',
		default: suggestedVersion,
		message,

		filter( input ) {
			return input.trim();
		},

		async validate( input ) {
			if ( !semver.valid( input ) ) {
				return 'Please provide a valid version.';
			}

			if ( !semver.gt( input, version ) ) {
				return `Provided version must be higher than "${ version }".`;
			}

			const isAvailable = await npm.checkVersionAvailability( input, packageName );

			if ( !isAvailable ) {
				return 'Given version is already taken.';
			}

			return true;
		},
		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + chalk.cyan( '?' )
	};

	const answers = await inquirer.prompt( [ versionQuestion ] );

	return answers.version;
}
