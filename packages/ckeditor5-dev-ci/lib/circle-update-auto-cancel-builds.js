/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @param options
 * @param {string} options.circleToken
 * @param {string} options.githubOrganization
 * @param {string} options.githubRepository
 * @param {boolean} options.newValue
 * @returns {Promise.<boolean>}
 */
export default async function circleUpdateAutoCancelBuilds( options ) {
	const {
		circleToken,
		githubOrganization,
		githubRepository,
		newValue
	} = options;

	const circleRequestOptions = {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Circle-Token': circleToken
		},
		body: JSON.stringify( {
			advanced: {
				autocancel_builds: newValue
			}
		} )
	};

	const settingsUpdateUrl = `https://circleci.com/api/v2/project/github/${ githubOrganization }/${ githubRepository }/settings`;

	return fetch( settingsUpdateUrl, circleRequestOptions )
		.then( r => r.json() );
}
