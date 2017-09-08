/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const getPackageJson = require( '../getpackagejson' );

const transformCommitUtils = {
	/**
	 * Map of available types of the commits.
	 * Types marked as `false` will be ignored during generating the changelog.
	 */
	availableCommitTypes: new Map( [
		[ 'Fix', true ],
		[ 'Fixes', true ],
		[ 'Fixed', true ],
		[ 'Feature', true ],
		[ 'Other', true ],
		[ 'Code style', false ],
		[ 'Docs', false ],
		[ 'Internal', false ],
		[ 'Tests', false ],
		[ 'Revert', false ],
		[ 'Release', false ]
	] ),

	/**
	 * Order of messages generated in changelog.
	 */
	typesOrder: {
		'Bug fixes': 1,
		'Features': 2,
		'Other changes': 3,

		'BREAKING CHANGES': 1,
		'NOTE': 2
	},

	/**
	 * Replaces reference to user (@name) with a link to his profile.
	 *
	 * @param {String} comment
	 * @returns {String}
	 */
	linkToGithubUser( comment ) {
		return comment.replace( /(.?)@([0-9A-Z_-]+)(\/)?/ig, ( matchedText, charBeforeAt, nickName, charAfterUser ) => {
			// Most probably the matched value is an email address.
			if ( charBeforeAt && /[A-Z0-9_]/i.test( charBeforeAt ) ) {
				return matchedText;
			}

			if ( charAfterUser === '/' ) {
				return matchedText;
			}

			charAfterUser = charAfterUser || '';

			return `${ charBeforeAt }[@${ nickName }](https://github.com/${ nickName })${ charAfterUser }`;
		} );
	},

	/**
	 * Replaces reference to issue (#ID) with a link to the issue.
	 * If comment matches to "organization/repository#ID", link will lead to the specified repository.
	 *
	 * @param {String} comment
	 * @returns {String}
	 */
	linkToGithubIssue( comment ) {
		return comment.replace( /(\/?[A-Z0-9-_]+\/[A-Z0-9-_]+)?#([0-9]+)/ig, ( matchedText, maybeRepository, issueId ) => {
			if ( maybeRepository ) {
				if ( maybeRepository.startsWith( '/' ) ) {
					return matchedText;
				}

				return `[${ maybeRepository }#${ issueId }](https://github.com/${ maybeRepository }/issues/${ issueId })`;
			}

			const packageJson = getPackageJson();
			const issuesUrl = ( typeof packageJson.bugs === 'object' ) ? packageJson.bugs.url : packageJson.bugs;

			if ( !issuesUrl ) {
				throw new Error( `The package.json for "${ packageJson.name }" must contain the "bugs" property.` );
			}

			return `[#${ issueId }](${ issuesUrl }/${ issueId })`;
		} );
	},

	/**
	 * Changes a singular type of commit to plural which will be displayed in a changelog.
	 *
	 * @param {String} commitType
	 * @returns {String}
	 */
	getCommitType( commitType ) {
		switch ( commitType ) {
			case 'Feature':
				return 'Features';

			case 'Fix':
			case 'Fixes':
			case 'Fixed':
				return 'Bug fixes';

			case 'Other':
				return 'Other changes';

			default:
				throw new Error( `Given invalid type of commit ("${ commitType }").` );
		}
	},

	/**
	 * @param {String} sentence
	 * @param {Number} length
	 * @returns {String}
	 */
	truncate( sentence, length ) {
		if ( sentence.length <= length ) {
			return sentence;
		}

		return sentence.slice( 0, length - 3 ).trim() + '...';
	}
};

module.exports = transformCommitUtils;
