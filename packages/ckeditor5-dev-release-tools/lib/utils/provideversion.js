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
 * Asks a user for providing the new version.
 *
 * @param {object} options
 * @param {string} options.packageName
 * @param {string} options.version
 * @param {string|null} options.releaseTypeOrNewVersion
 * @param {boolean} [options.disableInternalVersion=false] Whether to "internal" version is enabled.
 * @param {boolean} [options.disableSkipVersion=false] Whether to "skip" version is enabled.
 * @param {number} [options.indentLevel=0] The indent level.
 * @returns {Promise.<string>}
 */
export default function provideVersion( options ) {
	const {
		packageName,
		version,
		releaseTypeOrNewVersion,
		indentLevel = 0
	} = options;

	const suggestedVersion = getSuggestedVersion( {
		version,
		releaseTypeOrNewVersion,
		disableInternalVersion: options.disableInternalVersion
	} );

	let message = 'Type the new version, "skip" or "internal"';

	if ( options.disableInternalVersion ) {
		message = 'Type the new version or "skip"';
	}

	message += ` (suggested: "${ suggestedVersion }", current: "${ version }"):`;

	const versionQuestion = {
		type: 'input',
		name: 'version',
		default: suggestedVersion,
		message,

		filter( input ) {
			return input.trim();
		},

		async validate( input ) {
			if ( !options.disableSkipVersion && input === 'skip' ) {
				return true;
			}

			if ( !options.disableInternalVersion && input === 'internal' ) {
				return true;
			}

			if ( !semver.valid( input ) ) {
				return 'Please provide a valid version.';
			}

			const isAvailable = await npm.checkVersionAvailability( input, packageName );

			if ( !isAvailable ) {
				return 'Given version is already taken.';
			}

			return true;
		},

		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + chalk.cyan( '?' )
	};

	return inquirer.prompt( [ versionQuestion ] )
		.then( answers => answers.version );
}

/**
 * @param {object} options
 * @param {string} options.version
 * @param {string|null} options.releaseTypeOrNewVersion
 * @param {boolean} options.disableInternalVersion
 * @returns {string}
 */
function getSuggestedVersion( { version, releaseTypeOrNewVersion, disableInternalVersion } ) {
	if ( !releaseTypeOrNewVersion || releaseTypeOrNewVersion === 'skip' ) {
		return 'skip';
	}

	if ( semver.valid( releaseTypeOrNewVersion ) ) {
		return releaseTypeOrNewVersion;
	}

	if ( releaseTypeOrNewVersion === 'internal' ) {
		return disableInternalVersion ? 'skip' : 'internal';
	}

	if ( semver.prerelease( version ) ) {
		releaseTypeOrNewVersion = 'prerelease';
	}

	// If package's version is below the '1.0.0', bump the 'minor' instead of 'major'
	if ( releaseTypeOrNewVersion === 'major' && semver.gt( '1.0.0', version ) ) {
		return semver.inc( version, 'minor' );
	}

	return semver.inc( version, releaseTypeOrNewVersion );
}
