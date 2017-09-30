/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const inquirer = require( 'inquirer' );
const semver = require( 'semver' );

const cli = {
	/**
	 * Asks a user for a confirmation for creating the releases.
	 *
	 * @param {Map} packages Packages to release.
	 * @returns {Promise}
	 */
	confirmRelease( packages ) {
		let message = 'Packages to release:\n';

		for ( const packageName of Array.from( packages.keys() ).sort() ) {
			const packageDetails = packages.get( packageName );

			message += `  * "${ packageName }": v${ packageDetails.previousVersion } => v${ packageDetails.version }\n`;
		}

		message += 'Continue?';

		const confirmQuestion = {
			message,
			type: 'confirm',
			name: 'confirm',
			default: true,
		};

		return inquirer.prompt( [ confirmQuestion ] )
			.then( answers => answers.confirm );
	},

	/**
	 * Asks a user for providing the new version.
	 *
	 * @param {String} packageVersion
	 * @param {String|null} releaseType
	 * @param {Object} [options]
	 * @param {Boolean} [options.disableInternalVersion=false] Whether to "internal" version is enabled.
	 * @returns {Promise}
	 */
	provideVersion( packageVersion, releaseType, options = {} ) {
		let suggestedVersion;

		if ( !releaseType ) {
			// If package does not have changes, 'releaseType' is null and we don't want to generate the changelog.
			suggestedVersion = 'skip';
		} else if ( releaseType === 'major' && semver.gt( '1.0.0', packageVersion ) ) {
			// If package is below the '1.0.0' version, bump the 'minor' instead of 'major'
			suggestedVersion = semver.inc( packageVersion, 'minor' );
		} else {
			suggestedVersion = semver.inc( packageVersion, releaseType );
		}

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
				if ( input === 'skip' || ( !options.disableInternalVersion && input === 'internal' ) ) {
					return true;
				}

				// TODO: Check whether provided version is available.
				return semver.valid( input ) ? true : 'Please provide a valid version.';
			}
		};

		return inquirer.prompt( [ versionQuestion ] )
			.then( answers => answers.version );
	},

	/**
	 * Asks a user for providing the GitHub token.
	 *
	 * @returns {Promise}
	 */
	provideToken() {
		const tokenQuestion = {
			type: 'password',
			name: 'token',
			message: 'Provide the GitHub token:',
			validate( input ) {
				return input.length === 40 ? true : 'Please provide a valid token.';
			}
		};

		return inquirer.prompt( [ tokenQuestion ] )
			.then( answers => answers.token );
	},

	/**
	 * Asks a user for selecting services where packages will be released.
	 *
	 * If the user choices a GitHub, required token also has to be provided.
	 *
	 * @returns {Promise}
	 */
	configureReleaseOptions() {
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

		return inquirer.prompt( [ servicesQuestion ] )
			.then( answers => {
				options.skipNpm = answers.services.indexOf( 'npm' ) === -1;
				options.skipGithub = answers.services.indexOf( 'GitHub' ) === -1;

				if ( options.skipGithub ) {
					return options;
				}

				return cli.provideToken()
					.then( token => {
						options.token = token;

						return options;
					} );
			} );
	}
};

module.exports = cli;
