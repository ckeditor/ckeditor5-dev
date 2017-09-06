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
		[ 'Feature', true ],
		[ 'Fix', true ],
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
		return comment.replace( /@([0-9A-Z_-]+\/?)/ig, ( matchText, nickName ) => {
			if ( nickName.endsWith( '/' ) ) {
				return matchText;
			}

			return `[@${ nickName }](https://github.com/${ nickName })`;
		} );
	},

	/**
	 * Replaces reference to issue (#ID) with a link to the issue.
	 *
	 * @param {String} comment
	 * @returns {String}
	 */
	linkToGithubIssue( comment ) {
		const packageJson = getPackageJson();
		const issuesUrl = ( typeof packageJson.bugs === 'object' ) ? packageJson.bugs.url : packageJson.bugs;

		if ( !issuesUrl ) {
			throw new Error( `The package.json for "${ packageJson.name }" must contain the "bugs" property.` );
		}

		return comment.replace( /(.?)#([0-9]+)/g, ( matchText, charBeforeIssue, issueId ) => {
			// Don't replace anything if the '#ID' belongs to another part of the comment.
			if ( charBeforeIssue && /[A-Z0-9_-]/i.test( charBeforeIssue ) ) {
				return matchText;
			}

			return `${ charBeforeIssue }[#${ issueId }](${ issuesUrl }/${ issueId })`;
		} );
	},

	/**
	 * Replaces reference to repository (organization/repository) with a link to the repository.
	 *
	 * If the reference contains an issue, link will lead to the issue.
	 *
	 * @param {String} comment
	 * @returns {String}
	 */
	linkToGithubRepository( comment ) {
		return comment.replace( /(@|\.)?([A-Z0-9-_/]+)(#(\d+)?)?/gi, ( matchText, charBeforeRepo, repository, issueMark, issueId ) => {
			if ( !isValidRepository() ) {
				return matchText;
			}

			if ( issueId ) {
				return `[${ repository }#${ issueId }](https://github.com/${ repository }/issues/${ issueId })`;
			}

			return `[${ repository }](https://github.com/${ repository })`;

			function isValidRepository() {
				// If the repository starts with '@', it means the package link should lead to NPM.
				if ( matchText.startsWith( '@' ) ) {
					return false;
				}

				// If the repository starts with '.', it means the repository is part of other link.
				if ( matchText.startsWith( '.' ) ) {
					return false;
				}

				// If the issue hash (#) occurs in repository but the issue id misses, don't modify it.
				if ( issueMark && !issueId ) {
					return false;
				}

				// If the repository contains more than two slashes, it means the repository is a path.
				return repository.split( '/' ).length === 2;
			}
		} );
	},

	/**
	 * Replaces scoped package name with a link which will land to the package in NPM repository.
	 *
	 * @param {String} comment
	 * @returns {String}
	 */
	linkToNpmScopedPackage( comment ) {
		return comment.replace( /(@[A-Z0-9-_/]+)#?/gi, ( matchText, repository ) => {
			if ( repository.split( '/' ).length !== 2 || matchText.endsWith( '#' ) ) {
				return matchText;
			}

			return `[${ repository }](https://npmjs.com/package/${ repository })`;
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
