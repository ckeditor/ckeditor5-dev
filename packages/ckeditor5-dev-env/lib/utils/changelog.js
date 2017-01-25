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
	changelogFile: 'CHANGES.md',

	/**
	 * Changelog header.
	 */
	changelogHeader: `Changelog\n=========\n\n`,

	/**
	 * Returns all changes between `currentTag` and `previousTag`.
	 *
	 * If `previousTag` is null, returns the whole file (first release).
	 *
	 * @param {String} currentTag
	 * @param {String|null} previousTag
	 * @returns {String}
	 */
	getLatestChangesFromChangelog( currentTag, previousTag ) {
		currentTag = currentTag.replace( /^v/, '' );

		let changelog = utils.getCurrentChangelog().replace( utils.changelogHeader, '' );

		if ( previousTag ) {
			previousTag = previousTag.replace( /^v/, '' );

			changelog = changelog.match( new RegExp( `(## \\[${ currentTag }\\][\\w\\W]+)## \\[?${ previousTag }\\]?` ) )[ 1 ];
		}

		changelog = changelog.replace( new RegExp( `^## \\[?${ currentTag }\\]?.*` ), '' ).trim();

		return changelog;
	},

	/**
	 * @returns {String}
	 */
	getCurrentChangelog() {
		const changelogFile = path.resolve( utils.changelogFile );

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
