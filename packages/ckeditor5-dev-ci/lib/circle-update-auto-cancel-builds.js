/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @param options
 * @param {String} options.circleToken
 * @param {String} options.githubOrganization
 * @param {String} options.githubRepository
 * @param {Boolean} options.newValue
 * @return {Promise.<Boolean>}
 */
export default async function circleUpdateAutoCancelBuilds( options ) {
	const {
		circleToken,
		githubOrganization,
		githubRepository,
		newValue
	} = options;

	const circleRequestOptions = {
		method: 'patch',
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
