/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const RETRYABLE_STATUSES = new Set( [ 429, 500, 502, 503, 504 ] );

/**
 * Fetches and returns all jobs from a workflow except the currently running job.
 *
 * Retries transient API errors up to `maxAttempts` times.
 *
 * @param {object} options
 * @param {string} options.circleToken
 * @param {string} options.workflowId
 * @param {string} options.currentJobName
 * @param {number} [options.maxAttempts=5]
 * @param {number} [options.retryDelayMs=10000]
 * @returns {Promise<Array.<object>>}
 */
export default async function getOtherWorkflowJobs( options ) {
	const {
		circleToken,
		workflowId,
		currentJobName,
		maxAttempts = 5,
		retryDelayMs = 10 * 1000
	} = options;

	if ( !Number.isInteger( maxAttempts ) || maxAttempts < 1 ) {
		throw new Error( `Invalid option: "maxAttempts" must be a positive integer (received: ${ maxAttempts }).` );
	}

	if ( retryDelayMs < 0 ) {
		throw new Error( `Invalid option: "retryDelayMs" must be greater than or equal to 0 (received: ${ retryDelayMs }).` );
	}

	const requestUrl = `https://circleci.com/api/v2/workflow/${ workflowId }/job`;
	const requestOptions = {
		method: 'GET',
		headers: {
			'Circle-Token': circleToken
		}
	};

	for ( let attempt = 1; attempt <= maxAttempts; attempt++ ) {
		try {
			const response = await fetch( requestUrl, requestOptions )
				.catch( error => {
					throw createTransientError( `CircleCI API request failed due to a network error: ${ error.message }`, error );
				} );

			if ( !response.ok ) {
				const responseData = await parseResponseDataSafely( response );
				const details = getResponseMessage( responseData );
				const statusMessage = details ? `${ response.status }: ${ details }` : String( response.status );

				if ( RETRYABLE_STATUSES.has( response.status ) ) {
					throw createTransientError( `CircleCI API request failed with a retryable status (${ statusMessage }).` );
				}

				throw new Error(
					`CircleCI API request failed with a non-retryable status (${ statusMessage }). ` +
					'Verify CircleCI token and workflow configuration.'
				);
			}

			const responseData = await parseResponseData( response );

			if ( !responseData || !Array.isArray( responseData.items ) ) {
				throw createTransientError( 'CircleCI API response does not contain the "items" array.' );
			}

			return responseData.items.filter( job => job.name !== currentJobName );
		} catch ( error ) {
			if ( !isTransientError( error ) ) {
				throw error;
			}

			if ( attempt === maxAttempts ) {
				throw new Error(
					`CircleCI API seems unstable. Failed to fetch workflow jobs after ${ maxAttempts } attempts. ` +
					`Last error: ${ error.message } Please verify workflow results manually.`
				);
			}

			console.warn(
				`CircleCI API request failed (attempt ${ attempt }/${ maxAttempts }): ${ error.message } ` +
				`Retrying in ${ retryDelayMs }ms...`
			);

			await wait( retryDelayMs );
		}
	}
}

/**
 * @param {Response} response
 * @returns {Promise<object>}
 */
async function parseResponseData( response ) {
	try {
		return await response.json();
	} catch ( error ) {
		throw createTransientError( 'CircleCI API returned an invalid JSON response.', error );
	}
}

/**
 * @param {Response} response
 * @returns {Promise<object|null>}
 */
async function parseResponseDataSafely( response ) {
	try {
		return await response.json();
	} catch {
		return null;
	}
}

/**
 * @param {object} responseData
 * @returns {string|null}
 */
function getResponseMessage( responseData ) {
	if ( responseData && typeof responseData.message === 'string' ) {
		return responseData.message;
	}

	if ( responseData && typeof responseData.error === 'string' ) {
		return responseData.error;
	}

	return null;
}

/**
 * @param {number} delay
 * @returns {Promise<void>}
 */
function wait( delay ) {
	return new Promise( resolve => setTimeout( resolve, delay ) );
}

/**
 * @param {string} message
 * @param {Error} [cause]
 * @returns {Error & {code: 'CIRCLE_API_TRANSIENT'}}
 */
function createTransientError( message, cause ) {
	const error = new Error( message, { cause } );
	error.code = 'CIRCLE_API_TRANSIENT';

	return error;
}

/**
 * @param {unknown} error
 * @returns {error is Error & {code: 'CIRCLE_API_TRANSIENT'}}
 */
function isTransientError( error ) {
	return error instanceof Error && error.code === 'CIRCLE_API_TRANSIENT';
}
