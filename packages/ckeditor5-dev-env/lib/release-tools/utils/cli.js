/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const inquirer = require( 'inquirer' );
const getNextVersion = require( './getnextversion' );

const cli = {
	/**
	 * Asks a user for the confirmation for generating the changelog.
	 *
	 * @returns {Promise}
	 */
	confirmRelease() {
		return new Promise( ( resolve, reject ) => {
			const confirmQuestion = {
				type: 'confirm',
				name: 'confirm',
				default: false,
				message: 'Generated changelog will be empty. Continue?'
			};

			inquirer.prompt( [ confirmQuestion ] )
				.then( ( answers ) => resolve( answers.confirm ) )
				.catch( reject );
		} );
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
		return new Promise( ( resolve, reject ) => {
			const versionQuestion = {
				name: 'version',
				default: getNextVersion( packageVersion, releaseType ),
				message: `Provide next version for package "${ packageName }":`,
				validate( input ) {
					// TODO: Support for alpha/beta/rc.
					const regexp = /^\d+\.\d+\.\d+$/;

					return regexp.test( input ) ? true : 'Please provide a valid version (X.Y.Z).';
				}
			};

			return inquirer.prompt( [ versionQuestion ] )
				.then( ( answers ) => resolve( answers.version ) )
				.catch( reject );
		} );
	}
};

module.exports = cli;
