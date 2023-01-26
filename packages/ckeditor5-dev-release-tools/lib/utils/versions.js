/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
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
	 * @param {String} [cwd=process.cwd()] Where to look for the changelog file.
	 * @returns {String|null}
	 */
	getLastFromChangelog( cwd = process.cwd() ) {
		const changelog = changelogUtils.getChangelog( cwd );

		if ( !changelog ) {
			return null;
		}

		const regexp = /\n## \[?([\da-z.\-+]+)/i;
		const matches = changelog.match( regexp );

		return matches ? matches[ 1 ] : null;
	},

	/**
	 * Returns a name of the last created tag.
	 *
	 * @returns {String|null}
	 */
	getLastTagFromGit() {
		try {
			const lastTag = tools.shExec( 'git describe --abbrev=0 --tags 2> /dev/null', { verbosity: 'error' } );

			return lastTag.trim().replace( /^v/, '' ) || null;
		} catch ( err ) {
			/* istanbul ignore next */
			return null;
		}
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
