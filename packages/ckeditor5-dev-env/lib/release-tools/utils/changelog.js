/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

const utils = {
	/**
	 * Changelog file name.
	 */
	changelogFile: 'CHANGELOG.md',

	/**
	 * Changelog header.
	 */
	changelogHeader: 'Changelog\n=========\n\n',

	/**
	 * Retrieves changes from the changelog for the given version (tag).
	 *
	 * @param {String} version
	 * @param {String} [cwd=process.cwd()] Where to look for the changelog file.
	 * @returns {String|null}
	 */
	getChangesForVersion( version, cwd = process.cwd() ) {
		version = version.replace( /^v/, '' );

		const changelog = utils.getChangelog( cwd ).replace( utils.changelogHeader, '\n' );
		const match = changelog.match( new RegExp( `\\n(## \\[?${ version }\\]?[\\s\\S]+?)(?:\\n## \\[|$)` ) );

		if ( !match || !match[ 1 ] ) {
			return null;
		}

		return match[ 1 ].replace( /##[^\n]+\n/, '' ).trim();
	},

	/**
	 * @param {String} [cwd=process.cwd()] Where to look for the changelog file.
	 * @returns {String|null}
	 */
	getChangelog( cwd = process.cwd() ) {
		const changelogFile = path.join( cwd, utils.changelogFile );

		if ( !fs.existsSync( changelogFile ) ) {
			return null;
		}

		return fs.readFileSync( changelogFile, 'utf-8' );
	},

	/**
	 * @param {String} content
	 * @param {String} [cwd=process.cwd()] Where to look for the changelog file.
	 */
	saveChangelog( content, cwd = process.cwd() ) {
		const changelogFile = path.join( cwd, utils.changelogFile );

		fs.writeFileSync( changelogFile, content, 'utf-8' );
	},

	/**
	 * Checks whether specified `version` contains the "MAJOR BREAKING CHANGES" header.
	 *
	 * @param {String} version Version to check.
	 * @param {String} [cwd=process.cwd()] Where to look for the changelog file.
	 * @returns {Boolean}
	 */
	hasMajorBreakingChanges( version, cwd = process.cwd() ) {
		const changes = utils.getChangesForVersion( version, cwd );

		if ( !changes ) {
			throw new Error( `Entries for specified version (${ version }) cannot be found.` );
		}

		return !!changes.match( /### MAJOR BREAKING CHANGES/ );
	},

	/**
	 * Checks whether specified `version` contains the "MINOR BREAKING CHANGES" header.
	 *
	 * @param {String} version Version to check.
	 * @param {String} [cwd=process.cwd()] Where to look for the changelog file.
	 * @returns {Boolean}
	 */
	hasMinorBreakingChanges( version, cwd = process.cwd() ) {
		const changes = utils.getChangesForVersion( version, cwd );

		if ( !changes ) {
			throw new Error( `Entries for specified version (${ version }) cannot be found.` );
		}

		return !!changes.match( /### MINOR BREAKING CHANGES/ );
	}
};

module.exports = utils;
