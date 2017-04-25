/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
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
	changelogHeader: `Changelog\n=========\n\n`,

	/**
	 * Retrieves changes from the changelog for the given tag.
	 *
	 * @param {String} version
	 * @returns {String}
	 */
	getChangesForVersion( version ) {
		version = version.replace( /^v/, '' );

		let changelog = utils.getChangelog().replace( utils.changelogHeader, '\n' );

		const match = changelog.match( new RegExp( `\\n(## \\[?${ version }\\]?[\\s\\S]+?)(?:\\n## \\[|$)` ) );

		if ( !match || !match[ 1 ] ) {
			throw new Error( `Cannot find changelog entries for ${ version }.` );
		}

		return match[ 1 ].replace( /##[^\n]+\n/, '' ).trim();
	},

	/**
	 * @returns {String}
	 */
	getChangelog() {
		const changelogFile = path.resolve( utils.changelogFile );

		if ( !fs.existsSync( changelogFile ) ) {
			return null;
		}

		return fs.readFileSync( changelogFile, 'utf-8' );
	},

	/**
	 * @param {String} content
	 */
	saveChangelog( content ) {
		const changelogFile = path.resolve( utils.changelogFile );

		fs.writeFileSync( changelogFile, content, 'utf-8' );
	},
};

module.exports = utils;
