/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Updates the "Auto-cancel redundant workflows" option of a CircleCI project.
 *
 * The returned promise rejects when CircleCI responds with a non-2xx status, so callers
 * do not report success for a rejected request.
 *
 * @param options
 * @param {string} options.circleToken
 * @param {string} options.githubOrganization
 * @param {string} options.githubRepository
 * @param {boolean} options.newValue
 * @returns {Promise.<object>}
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

	const response = await fetch( settingsUpdateUrl, circleRequestOptions );

	if ( !response.ok ) {
		const details = await getErrorDetails( response );
		const statusMessage = details ? `${ response.status }: ${ details }` : String( response.status );

		throw new Error(
			'CircleCI rejected the request to update the "Auto-cancel redundant workflows" option ' +
			`for "${ githubOrganization }/${ githubRepository }" (${ statusMessage }). ` +
			'Verify the CircleCI token and its permissions to the project.'
		);
	}

	return response.json();
}

/**
 * Extracts a human-readable error message from a CircleCI error response.
 *
 * @param {Response} response
 * @returns {Promise.<string|null>}
 */
async function getErrorDetails( response ) {
	const text = await response.text().catch( () => '' );

	if ( !text ) {
		return null;
	}

	try {
		const data = JSON.parse( text );

		return data.message || text;
	} catch {
		return text;
	}
}
