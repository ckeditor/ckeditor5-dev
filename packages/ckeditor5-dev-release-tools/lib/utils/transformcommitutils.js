/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';

/**
 * A regexp for extracting additional changelog entries from the single commit.
 * Prefixes of the commit must be synchronized the `getCommitType()` util.
 */
export const MULTI_ENTRIES_COMMIT_REGEXP = /(?:Feature|Other|Fix|Docs|Internal|Tests|Revert|Release)(?: \([\w\-, ]+?\))?:/g;

/**
 * Map of available types of the commits.
 * Types marked as `false` will be ignored during generating the changelog.
 */
export const availableCommitTypes = new Map( [
	[ 'Fix', true ],
	[ 'Feature', true ],
	[ 'Other', true ],

	[ 'Docs', false ],
	[ 'Internal', false ],
	[ 'Tests', false ],
	[ 'Revert', false ],
	[ 'Release', false ]
] );

/**
 * Order of messages generated in changelog.
 */
export const typesOrder = {
	'Features': 1,
	'Bug fixes': 2,
	'Other changes': 3,

	'MAJOR BREAKING CHANGES': 1,
	'MINOR BREAKING CHANGES': 2,
	'BREAKING CHANGES': 3
};

/**
 * Returns an order of a message in the changelog.
 *
 * @param {string} title
 * @returns {number}
 */
export function getTypeOrder( title ) {
	for ( const typeTitle of Object.keys( typesOrder ) ) {
		if ( title.startsWith( typeTitle ) ) {
			return typesOrder[ typeTitle ];
		}
	}

	return 10;
}

/**
 * Replaces reference to the user (`@name`) with a link to the user's profile.
 *
 * @param {string} comment
 * @returns {string}
 */
export function linkToGithubUser( comment ) {
	return comment.replace( /(^|[\s(])@([\w-]+)(?![/\w-])/ig, ( matchedText, charBefore, nickName ) => {
		return `${ charBefore }[@${ nickName }](https://github.com/${ nickName })`;
	} );
}

/**
 * Replaces reference to issue (#ID) with a link to the issue.
 * If comment matches to "organization/repository#ID", link will lead to the specified repository.
 *
 * @param {string} comment
 * @returns {string}
 */
export function linkToGithubIssue( comment ) {
	return comment.replace( /(\/?[\w-]+\/[\w-]+)?#([\d]+)(?=$|[\s,.)\]])/igm, ( matchedText, maybeRepository, issueId ) => {
		if ( maybeRepository ) {
			if ( maybeRepository.startsWith( '/' ) ) {
				return matchedText;
			}

			return `[${ maybeRepository }#${ issueId }](https://github.com/${ maybeRepository }/issues/${ issueId })`;
		}

		const repositoryUrl = workspaces.getRepositoryUrl();

		// But if doesn't, let's add it.
		return `[#${ issueId }](${ repositoryUrl }/issues/${ issueId })`;
	} );
}

/**
 * Changes a singular type of commit to plural which will be displayed in a changelog.
 *
 * The switch cases must be synchronized with the `MULTI_ENTRIES_COMMIT_REGEXP` regexp.
 *
 * @param {string} commitType
 * @returns {string}
 */
export function getCommitType( commitType ) {
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
}

/**
 * @param {string} sentence
 * @param {number} length
 * @returns {string}
 */
export function truncate( sentence, length ) {
	if ( sentence.length <= length ) {
		return sentence;
	}

	return sentence.slice( 0, length - 3 ).trim() + '...';
}
