/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const changelogUtils = require( './changelog' );
const getPackageJson = require( './getpackagejson' );

const versions = {
	/**
	 * Returns a last created version in changelog file.
	 *
	 * @returns {String|null}
	 */
	getLastFromChangelog() {
		const changelog = changelogUtils.getChangelog();

		if ( !changelog ) {
			return null;
		}

		const regexp = /\n## (\[([^\]]+)|[^ ]+)/;
		const matches = changelog.match( regexp );

		if ( !matches ) {
			return null;
		}

		return matches[ 2 ] ? matches[ 2 ] : matches[ 1 ];
	},

	/**
	 * Returns a name of the last created tag.
	 *
	 * @returns {String|null}
	 */
	getLastTagFromGit() {
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
		return getPackageJson( cwd ).version;
	}
};

module.exports = versions;
