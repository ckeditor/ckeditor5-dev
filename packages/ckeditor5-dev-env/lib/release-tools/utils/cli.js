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

		for ( const [ packageName, packageDetails ] of packages ) {
			message += `  * "${ packageName }": v${ packageDetails.version }\n`;
		}

		message += 'Continue?';

		const confirmQuestion = {
			message,
			type: 'confirm',
			name: 'confirm',
			default: true,
		};

		return inquirer.prompt( [ confirmQuestion ] )
			.then( ( answers ) => answers.confirm );
	},

	/**
	 * Asks a user for providing the new version.
	 *
	 * @param {String} packageName
	 * @param {String} packageVersion
	 * @param {String} releaseType
	 * @returns {Promise}
	 */
	provideVersion( packageName, packageVersion, releaseType ) {
		const suggestedVersion = releaseType ? semver.inc( packageVersion, releaseType ) : 'skip';

		const versionQuestion = {
			type: 'input',
			name: 'version',
			default: suggestedVersion,
			message:
				`Type the new version or "skip" (suggested: "${ suggestedVersion }", current: "${ packageVersion }"):`,

			filter( input ) {
				return input.trim();
			},

			validate( input ) {
				if ( input === 'skip' ) {
					return true;
				}

				// TODO: Check whether provided version is available.
				return semver.valid( input ) ? true : 'Please provide a valid version.';
			}
		};

		return inquirer.prompt( [ versionQuestion ] )
			.then( ( answers ) => answers.version );
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
			message: `Provide the GitHub token:`,
			validate( input ) {
				return input.length === 40 ? true : 'Please provide a valid token.';
			}
		};

		return inquirer.prompt( [ tokenQuestion ] )
			.then( ( answers ) => answers.token );
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
			message: `Select services where packages will be released:`,
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
			.then( ( answers ) => {
				options.skipNpm = answers.services.indexOf( 'npm' ) === -1;
				options.skipGithub = answers.services.indexOf( 'GitHub' ) === -1;

				if ( options.skipGithub ) {
					return options;
				}

				return cli.provideToken()
					.then( ( token ) => {
						options.token = token;

						return options;
					} );
			} );
	}
};

module.exports = cli;
