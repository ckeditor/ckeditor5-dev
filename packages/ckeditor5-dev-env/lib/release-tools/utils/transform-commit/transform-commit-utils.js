/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
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
		'Features': 1,
		'Bug fixes': 2,
		'Other changes': 3,

		'BREAKING CHANGES': 1,
		'NOTE': 2
	},

	/**
	 * Additional descriptions used in summary changelog generator. Keys of the object must match to values returned by
	 * `transformCommitUtils#getCommitType()` function.
	 */
	additionalCommitNotes: {
		'Bug fixes': 'Besides changes in the dependencies, this version also contains the following bug fixes:',
		Features: 'Besides new features introduced by the dependencies, this version also introduces the following features:'
	},

	/**
	 * Replaces reference to the user (`@name`) with a link to the user's profile.
	 *
	 * @param {String} comment
	 * @returns {String}
	 */
	linkToGithubUser( comment ) {
		return comment.replace( /(^|[\s(])@([\w-]+)(?![/\w-])/ig, ( matchedText, charBefore, nickName ) => {
			return `${ charBefore }[@${ nickName }](https://github.com/${ nickName })`;
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
		return comment.replace( /(\/?[\w-]+\/[\w-]+)?#([\d]+)/ig, ( matchedText, maybeRepository, issueId ) => {
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
