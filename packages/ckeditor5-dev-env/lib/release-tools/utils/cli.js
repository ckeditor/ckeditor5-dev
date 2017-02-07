/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const inquirer = require( 'inquirer' );
const semver = require( 'semver' );

const cli = {
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
				default: ( releaseType ) ? semver.inc( packageVersion, releaseType ) : 'skip',
				message: `New version for "${ packageName }" (currently ${ packageVersion }, type new version or "skip")?`,
				validate( input ) {
					if ( input === 'skip' ) {
						return true;
					}

					// TODO: Check whether provided version is available.
					return semver.valid( input ) ? true : 'Please provide a valid version.';
				}
			};

			return inquirer.prompt( [ versionQuestion ] )
				.then( ( answers ) => resolve( answers.version ) )
				.catch( reject );
		} );
	}
};

module.exports = cli;
