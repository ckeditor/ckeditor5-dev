/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const inquirer = require( 'inquirer' );
const semver = require( 'semver' );
const chalk = require( 'chalk' );

const QUESTION_MARK = chalk.cyan( '?' );

const cli = {
	/**
	 * A size of default indent for a log.
	 */
	INDENT_SIZE: 3,

	/**
	 * A size of indent for a second and next lines in a log. The number is equal to length of the log string:
	 * '* 1234567 ', where '1234567' is a short commit id.
	 * It does not include a value from `cli.INDENT_SIZE`.
	 */
	COMMIT_INDENT_SIZE: 10,

	/**
	 * Asks a user for a confirmation for updating and tagging versions of the packages.
	 *
	 * @param {Map} packages Packages to release.
	 * @returns {Promise.<Boolean>}
	 */
	confirmUpdatingVersions( packages ) {
		let message = 'Packages and their old and new versions:\n';

		for ( const packageName of Array.from( packages.keys() ).sort() ) {
			const packageDetails = packages.get( packageName );

			message += `  * "${ packageName }": v${ packageDetails.previousVersion } => v${ packageDetails.version }\n`;
		}

		message += 'Continue?';

		const confirmQuestion = {
			message,
			type: 'confirm',
			name: 'confirm',
			default: true
		};

		return inquirer.prompt( [ confirmQuestion ] )
			.then( answers => answers.confirm );
	},

	/**
	 * Asks a user for a confirmation for publishing changes.
	 *
	 * @param {Map} packages Packages to release.
	 * @returns {Promise.<Boolean>}
	 */
	confirmPublishing( packages ) {
		let message = 'Services where the release will be created:\n';

		for ( const packageName of Array.from( packages.keys() ).sort() ) {
			const packageDetails = packages.get( packageName );

			let packageMessage = `  * "${ packageName }" - version: ${ packageDetails.version }`;

			const services = [];

			if ( packageDetails.shouldReleaseOnNpm ) {
				services.push( 'NPM' );
			}

			if ( packageDetails.shouldReleaseOnGithub ) {
				services.push( 'GitHub' );
			}

			let color;

			if ( services.length ) {
				color = chalk.magenta;
				packageMessage += ` - services: ${ services.join( ', ' ) } `;
			} else {
				color = chalk.gray;
				packageMessage += ' - nothing to release';
			}

			message += color( packageMessage ) + '\n';
		}

		message += 'Continue?';

		const confirmQuestion = {
			message,
			type: 'confirm',
			name: 'confirm',
			default: true
		};

		return inquirer.prompt( [ confirmQuestion ] )
			.then( answers => answers.confirm );
	},

	/**
	 * Asks a user for a confirmation for removing archives created by `npm pack` command.
	 *
	 * @returns {Promise.<Boolean>}
	 */
	confirmRemovingFiles() {
		const confirmQuestion = {
			message: 'Remove created archives?',
			type: 'confirm',
			name: 'confirm',
			default: true
		};

		return inquirer.prompt( [ confirmQuestion ] )
			.then( answers => answers.confirm );
	},

	/**
	 * Asks a user for a confirmation for including a package that does not contain all required files.
	 *
	 * @returns {Promise.<Boolean>}
	 */
	confirmIncludingPackage() {
		const confirmQuestion = {
			message: 'Package does not contain all required files to publish. Include this package in the release and continue?',
			type: 'confirm',
			name: 'confirm',
			default: true
		};

		return inquirer.prompt( [ confirmQuestion ] )
			.then( answers => answers.confirm );
	},

	/**
	 * Asks a user for providing the new version.
	 *
	 * @param {String} packageVersion
	 * @param {String|null} releaseTypeOrNewVersion
	 * @param {Object} [options]
	 * @param {Boolean} [options.disableInternalVersion=false] Whether to "internal" version is enabled.
	 * @param {Boolean} [options.disableSkipVersion=false] Whether to "skip" version is enabled.
	 * @param {Number} [options.indentLevel=0] The indent level.
	 * @returns {Promise.<String>}
	 */
	provideVersion( packageVersion, releaseTypeOrNewVersion, options = {} ) {
		const indentLevel = options.indentLevel || 0;
		const suggestedVersion = getSuggestedVersion();

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

			prefix: getPrefix( indentLevel )
		};

		return inquirer.prompt( [ versionQuestion ] )
			.then( answers => answers.version );

		function getSuggestedVersion() {
			if ( !releaseTypeOrNewVersion || releaseTypeOrNewVersion === 'skip' ) {
				return 'skip';
			}

			if ( semver.valid( releaseTypeOrNewVersion ) ) {
				return releaseTypeOrNewVersion;
			}

			if ( releaseTypeOrNewVersion === 'internal' ) {
				return options.disableInternalVersion ? 'skip' : 'internal';
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
	},

	/**
	 * Asks a user for providing the new version for a major release.
	 *
	 * @param {String} version
	 * @param {String} foundPackage
	 * @param {String} bumpType
	 * @param {Object} [options={}]
	 * @param {Number} [options.indentLevel=0] The indent level.
	 * @returns {Promise.<String>}
	 */
	provideNewVersionForMonoRepository( version, foundPackage, bumpType, options = {} ) {
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
			prefix: getPrefix( indentLevel )
		};

		return inquirer.prompt( [ versionQuestion ] )
			.then( answers => answers.version );
	},

	/**
	 * Asks a user for providing the GitHub token.
	 *
	 * @returns {Promise.<String>}
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
	 * @returns {Promise.<Object>}
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
				options.npm = answers.services.includes( 'npm' );
				options.github = answers.services.includes( 'GitHub' );

				if ( !options.github ) {
					return options;
				}

				return cli.provideToken()
					.then( token => {
						options.token = token;

						return options;
					} );
			} );
	},

	/**
	 * Asks a user for a confirmation for updating and tagging versions of the packages.
	 *
	 * @param {String} versionTag A version tag based on a package version specified in `package.json`.
	 * @param {String} npmTag A tag typed by the user when using the release tools.
	 * @returns {Promise.<Boolean>}
	 */
	confirmNpmTag( versionTag, npmTag ) {
		const areVersionsEqual = versionTag === npmTag;
		const color = areVersionsEqual ? chalk.magenta : chalk.red;

		// eslint-disable-next-line max-len
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
};

module.exports = cli;

function getPrefix( indent ) {
	return ' '.repeat( indent * cli.INDENT_SIZE ) + QUESTION_MARK;
}
