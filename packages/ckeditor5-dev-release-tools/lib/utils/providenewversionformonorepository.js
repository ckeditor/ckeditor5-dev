/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import inquirer from 'inquirer';
import semver from 'semver';
import chalk from 'chalk';
import { CLI_INDENT_SIZE } from './constants.js';

/**
 * Asks a user for providing the new version for a major release.
 *
 * @param {string} version
 * @param {string} foundPackage
 * @param {string} bumpType
 * @param {object} [options={}]
 * @param {number} [options.indentLevel=0] The indent level.
 * @returns {Promise.<string>}
 */
export default async function provideNewVersionForMonoRepository( version, foundPackage, bumpType, options = {} ) {
	const indentLevel = options.indentLevel || 0;
	const suggestedVersion = semver.inc( version, bumpType );

	const message = 'Type the new version ' +
		`(current highest: "${ version }" found in "${ chalk.underline( foundPackage ) }", suggested: "${ suggestedVersion }"):`;

	const versionQuestion = {
		type: 'input',
		name: 'version',
		default: suggestedVersion,
		message,

		filter( input ) {
			return input.trim();
		},

		validate( input ) {
			if ( !semver.valid( input ) ) {
				return 'Please provide a valid version.';
			}

			return semver.gt( input, version ) ? true : `Provided version must be higher than "${ version }".`;
		},
		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + chalk.cyan( '?' )
	};

	const answers = await inquirer.prompt( [ versionQuestion ] );

	return answers.version;
}
