/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * @param {Array.<WorkflowJob>} jobs
 * @param {String} failingParentFlag
 * @returns {Array.<WorkflowJob>}
 */
module.exports = function processJobStatuses( jobs, failingParentFlag ) {
	const jobsClone = JSON.parse( JSON.stringify( jobs ) );

	let changesMade = false;

	for ( const job of jobsClone ) {
		if ( !job.dependencies.length ) {
			continue;
		}

		if ( [ 'failed', failingParentFlag ].includes( job.status ) ) {
			continue;
		}

		for ( const parentJobId of job.dependencies ) {
			const parentJob = jobsClone.find( job => job.id === parentJobId );

			if ( ![ 'failed', failingParentFlag ].includes( parentJob.status ) ) {
				continue;
			}

			job.status = failingParentFlag;

			changesMade = true;
		}
	}

	if ( changesMade ) {
		return processJobStatuses( jobsClone, failingParentFlag );
	}

	return jobsClone;
};

/**
 * @typedef {Object} WorkflowJob
 *
 * @property {String} id
 *
 * @property {String} status
 *
 * @property {Array.<String>} dependencies
 */
