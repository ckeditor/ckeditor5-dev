/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const changelogUtils = require( './changelog' );

const versions = {
	/**
	 * Returns a last created version in changelog file.
	 *
	 * @returns {String|null}
	 */
	getLastFromChangelog() {
		const changelog = changelogUtils.getChangelog();
		// TODO: Support for versions: alpha/beta/rc.
		const regexp = /## \[?(\d+\.\d+\.\d+)\]?/;

		const matches = changelog.match( regexp );

		return ( matches ) ? matches[ 1 ] : null;
	},

	/**
	 * Returns a name of the last created tag.
	 *
	 * @returns {String|null}
	 */
	getLastFromTag() {
		const lastTag = tools.shExec( 'git describe --abbrev=0 --tags 2> /dev/null', { verbosity: 'error' } );

		return lastTag.trim().replace( /^v/, '' ) || null;
	},

	/**
	 * Returns version of current package from `package.json`.
	 *
	 * @param {String} [cwd=process.cwd()] Current work directory.
	 * @returns {String}
	 */
	getCurrent( cwd = process.cwd() ) {
		const packageJson = require( path.join( cwd, 'package.json' ) );

		return packageJson.version;
	},

	/**
	 * Returns number of the next version.
	 *
	 * @param {String} currentVersion Current version in format "X.Y.Z".
	 * @param {String} releaseType Type of the next release.
	 * @returns {String}
	 */
	getNext( currentVersion, releaseType ) {
		if ( currentVersion.startsWith( 'v' ) ) {
			currentVersion = currentVersion.slice( 1 );
		}

		const version = currentVersion.split( '.' ).map( ( n ) => parseInt( n ) );

		if ( releaseType === 'major' ) {
			return `${ version[ 0 ] + 1 }.0.0`;
		} else if ( releaseType === 'minor' ) {
			return `${ version[ 0 ] }.${ version[ 1 ] + 1 }.0`;
		}

		return `${ version[ 0 ] }.${ version[ 1 ] }.${ version[ 2 ] + 1 }`;
	}
};

module.exports = versions;
