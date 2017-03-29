/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const getPackageJson = require( './getpackagejson' );

const transformCommit = {
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
	 * Changes user's name to link that leads to the user's profile.
	 *
	 * @param {String} value
	 * @returns {String}
	 */
	linkGithubUsers( value ) {
		return value.replace( /@([\w\d_-]+)/g, '[@$1](https://github.com/$1)' );
	},

	/**
	 * Changes references to issue to links that lead to the GitHub issue page.
	 *
	 * @param {String} value
	 * @param {Array} [issues=null]
	 * @returns {String}
	 */
	linkGithubIssues( value, issues = null ) {
		const packageJson = getPackageJson();
		const issuesUrl = ( typeof packageJson.bugs === 'object' ) ? packageJson.bugs.url : packageJson.bugs;

		if ( !issuesUrl ) {
			throw new Error( `The package.json for "${ packageJson.name }" must contain the "bugs" property.` );
		}

		return value.replace( /#([0-9]+)/g, ( _, issueId ) => {
			if ( Array.isArray( issues ) ) {
				issues.push( issueId );
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
				return 'Bug fixes';

			case 'Other':
				return 'Other changes';

			default:
				throw new Error( `Given invalid type of commit ("${ commitType }").` );
		}
	}
};

module.exports = transformCommit;
