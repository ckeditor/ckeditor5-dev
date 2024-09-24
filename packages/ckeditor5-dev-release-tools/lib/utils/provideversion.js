/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import inquirer from 'inquirer';
import semver from 'semver';
import chalk from 'chalk';
import { CLI_INDENT_SIZE } from './constants.js';

/**
 * Asks a user for providing the new version.
 *
 * @param {string} packageVersion
 * @param {string|null} releaseTypeOrNewVersion
 * @param {object} [options]
 * @param {boolean} [options.disableInternalVersion=false] Whether to "internal" version is enabled.
 * @param {boolean} [options.disableSkipVersion=false] Whether to "skip" version is enabled.
 * @param {number} [options.indentLevel=0] The indent level.
 * @returns {Promise.<string>}
 */
export default function provideVersion( packageVersion, releaseTypeOrNewVersion, options = {} ) {
	const indentLevel = options.indentLevel || 0;
	const suggestedVersion = getSuggestedVersion( {
		packageVersion,
		releaseTypeOrNewVersion,
		disableInternalVersion: options.disableInternalVersion
	} );

	let message = 'Type the new version, "skip" or "internal"';

	if ( options.disableInternalVersion ) {
		message = 'Type the new version or "skip"';
	}

	message += ` (suggested: "${ suggestedVersion }", current: "${ packageVersion }"):`;

	const versionQuestion = {
		type: 'input',
		name: 'version',
		default: suggestedVersion,
		message,

		filter( input ) {
			return input.trim();
		},

		validate( input ) {
			if ( !options.disableSkipVersion && input === 'skip' ) {
				return true;
			}

			if ( !options.disableInternalVersion && input === 'internal' ) {
				return true;
			}

			// TODO: Check whether provided version is available.
			return semver.valid( input ) ? true : 'Please provide a valid version.';
		},

		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + chalk.cyan( '?' )
	};

	return inquirer.prompt( [ versionQuestion ] )
		.then( answers => answers.version );
}

/**
 * @param {object} options
 * @param {string} options.packageVersion
 * @param {string|null} options.releaseTypeOrNewVersion
 * @param {boolean} options.disableInternalVersion
 * @returns {string}
 */
function getSuggestedVersion( { packageVersion, releaseTypeOrNewVersion, disableInternalVersion } ) {
	if ( !releaseTypeOrNewVersion || releaseTypeOrNewVersion === 'skip' ) {
		return 'skip';
	}

	if ( semver.valid( releaseTypeOrNewVersion ) ) {
		return releaseTypeOrNewVersion;
	}

	if ( releaseTypeOrNewVersion === 'internal' ) {
		return disableInternalVersion ? 'skip' : 'internal';
	}

	if ( semver.prerelease( packageVersion ) ) {
		releaseTypeOrNewVersion = 'prerelease';
	}

	// If package's version is below the '1.0.0', bump the 'minor' instead of 'major'
	if ( releaseTypeOrNewVersion === 'major' && semver.gt( '1.0.0', packageVersion ) ) {
		return semver.inc( packageVersion, 'minor' );
	}

	return semver.inc( packageVersion, releaseTypeOrNewVersion );
}
