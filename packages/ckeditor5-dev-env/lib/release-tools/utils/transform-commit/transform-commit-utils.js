/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
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
		[ 'Fixes', true ], // TODO: Remove.
		[ 'Fixed', true ], // TODO: Remove.
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

			const repositoryUrl = transformCommitUtils.getRepositoryUrl();

			// But if doesn't, let's add it.
			return `[#${ issueId }](${ repositoryUrl }/issues/${ issueId })`;
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
	},

	/**
	 * Returns a URL to the repository whether the commit is being parsed.
	 *
	 * @param {String} [cwd=process.cwd()]
	 * @returns {String}
	 */
	getRepositoryUrl( cwd = process.cwd() ) {
		const packageJson = getPackageJson( cwd );

		// Due to merging our issue trackers, `packageJson.bugs` will point to the same place for every package.
		// We cannot rely on this value anymore. See: https://github.com/ckeditor/ckeditor5/issues/1988.
		// Instead of we can take a value from `packageJson.repository` and adjust it to match to our requirements.
		let repositoryUrl = ( typeof packageJson.repository === 'object' ) ? packageJson.repository.url : packageJson.repository;

		if ( !repositoryUrl ) {
			throw new Error( `The package.json for "${ packageJson.name }" must contain the "repository" property.` );
		}

		// If the value ends with ".git", we need to remove it.
		repositoryUrl = repositoryUrl.replace( /\.git$/, '' );

		// Remove "/issues" suffix as well.
		repositoryUrl = repositoryUrl.replace( /\/issues/, '' );

		return repositoryUrl;
	}
};

module.exports = transformCommitUtils;
