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
	 * Returns the current (latest) nightly version in the format of "0.0.0-nightly-YYYYMMDD.X", where the "YYYYMMDD" is the date of the
	 * last nightly release and the "X" is the sequential number starting from 0. If the package does not have any nightly releases yet,
	 * `null` is returned.
	 *
	 * @returns {Promise<String|null>}
	 */
	getLastNightly( cwd = process.cwd() ) {
		const packageName = getPackageJson( cwd ).name;

		return tools.shExec( `npm view ${ packageName }@nightly version`, { verbosity: 'silent', async: true } )
			.catch( () => null );
	},

	/**
	 * Returns the next free nightly version in the format of "0.0.0-nightly-YYYYMMDD.X", where the "YYYYMMDD" is the current date and the
	 * "X" is the next available sequential number starting from 0.
	 *
	 * @returns {Promise<String>}
	 */
	async getNextNightly( cwd = process.cwd() ) {
		const today = new Date();
		const year = today.getFullYear().toString();
		const month = ( today.getMonth() + 1 ).toString().padStart( 2, '0' );
		const day = today.getDate().toString().padStart( 2, '0' );

		const nextNightlyVersion = `0.0.0-nightly-${ year }${ month }${ day }`;
		const currentNightlyVersion = await versions.getLastNightly( cwd );

		if ( !currentNightlyVersion ) {
			return `${ nextNightlyVersion }.0`;
		}

		if ( !currentNightlyVersion.startsWith( nextNightlyVersion ) ) {
			return `${ nextNightlyVersion }.0`;
		}

		const currentNightlyVersionId = currentNightlyVersion.split( '.' ).pop();
		const nextNightlyVersionId = Number( currentNightlyVersionId ) + 1;

		return `${ nextNightlyVersion }.${ nextNightlyVersionId }`;
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
