/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { getRepositoryUrl } from './transformcommitutils';

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
		const match = changelog.match( new RegExp( `\\n(## \\[?${ version }\\]?[\\s\\S]+?)(?:\\n## \\[?|$)` ) );

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
	 * @param {Number} length
	 * @param {String} [cwd=process.cwd()] Where to look for the changelog file.
	 */
	truncateChangelog( length, cwd = process.cwd() ) {
		const changelog = utils.getChangelog( cwd );

		if ( !changelog ) {
			return;
		}

		const entryHeader = '## [\\s\\S]+?';
		const entryHeaderRegexp = new RegExp( `\\n(${ entryHeader })(?=\\n${ entryHeader }|$)`, 'g' );

		const entries = [ ...changelog.matchAll( entryHeaderRegexp ) ]
			.filter( match => match && match[ 1 ] )
			.map( match => match[ 1 ] );

		if ( !entries.length ) {
			return;
		}

		const truncatedEntries = entries.slice( 0, length );

		const changelogFooter = entries.length > truncatedEntries.length ?
			`\n\n---\n\nTo see all releases, visit the [release page](${ getRepositoryUrl( cwd ) }/releases).\n` :
			'\n';

		const truncatedChangelog = utils.changelogHeader + truncatedEntries.join( '\n' ).trim() + changelogFooter;

		utils.saveChangelog( truncatedChangelog, cwd );
	},

	/**
	 * @returns {String}
	 */
	getFormattedDate() {
		return format( new Date(), 'yyyy-MM-dd' );
	}
};

export default utils;
