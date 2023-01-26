/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const getPackageJson = require( './getpackagejson' );

const transformCommitUtils = {
	/**
	 * A regexp for extracting additional changelog entries from the single commit.
	 * Prefixes of the commit must be synchronized the `getCommitType()` util.
	 */
	MULTI_ENTRIES_COMMIT_REGEXP: /(?:Feature|Other|Fix|Docs|Internal|Tests|Revert|Release)(?: \([\w\-, ]+?\))?:/g,

	/**
	 * Map of available types of the commits.
	 * Types marked as `false` will be ignored during generating the changelog.
	 */
	availableCommitTypes: new Map( [
		[ 'Fix', true ],
		[ 'Feature', true ],
		[ 'Other', true ],

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

		'MAJOR BREAKING CHANGES': 1,
		'MINOR BREAKING CHANGES': 2,
		'BREAKING CHANGES': 3
	},

	/**
	 * Returns an order of a message in the changelog.
	 *
	 * @param {String} title
	 * @returns {Number}
	 */
	getTypeOrder( title ) {
		for ( const typeTitle of Object.keys( transformCommitUtils.typesOrder ) ) {
			if ( title.startsWith( typeTitle ) ) {
				return transformCommitUtils.typesOrder[ typeTitle ];
			}
		}

		return 10;
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
	 * The switch cases must be synchronized with the `MULTI_ENTRIES_COMMIT_REGEXP` regexp.
	 *
	 * @param {String} commitType
	 * @returns {String}
	 */
	getCommitType( commitType ) {
		switch ( commitType ) {
			case 'Feature':
				return 'Features';

			case 'Fix':
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
