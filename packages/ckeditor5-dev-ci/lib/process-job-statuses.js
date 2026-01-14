/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * The function aims to determine a proper build status for children's jobs based on their parent's statuses.
 *
 * For example, in the following workflow:
 *
 * ┌────┐     ┌────┐
 * │Id 1├────►│Id 2│
 * └────┘     └────┘
 *
 * If the "Id 1" job is marked as failed, the "Id 2" job should be kept, too (it will never start due to an error in the parent task).
 *
 * @param {Array.<WorkflowJob>} jobs
 * @returns {Array.<WorkflowJob>}
 */
export default function processJobStatuses( jobs ) {
	// To avoid modifying the original object, let's clone.
	const jobsClone = clone( jobs );

	// Find jobs to mark as "failed" based on their relationship.
	const jobsToProcess = jobsClone
		.filter( job => {
			// Ignore job with no dependencies.
			if ( !job.dependencies.length ) {
				return false;
			}

			// If the job is already marked as failed, ignore it, too.
			if ( isJobFailed( job ) ) {
				return false;
			}

			// Verify if the job is a descant child of any failed job.
			const dependencies = job.dependencies
				.map( parentJobId => jobsClone.find( job => job.id === parentJobId ) )
				.filter( parentJob => isJobFailed( parentJob ) );

			// If so, save the job to process.
			return dependencies.length;
		} );

	for ( const job of jobsToProcess ) {
		job.status = 'failed_parent';
	}

	// Whenever a job has been changed, we need to iterate over all jobs again to verify the remaining jobs.
	if ( jobsToProcess.length ) {
		return processJobStatuses( jobsClone );
	}

	return jobsClone;
}

/**
 * @param {WorkflowJob} job
 * @returns {boolean}
 */
function isJobFailed( job ) {
	if ( job.status === 'failed' ) {
		return true;
	}

	if ( job.status === 'failed_parent' ) {
		return true;
	}

	return false;
}

/**
 * @template T
 * @param {T} obj
 * @returns {T}
 */
function clone( obj ) {
	return JSON.parse( JSON.stringify( obj ) );
}

/**
 * @typedef {object} WorkflowJob
 *
 * @property {string} id
 *
 * @property {'blocked'|'running'|'failed'|'failed_parent'|'success'} status
 *
 * @property {Array.<string>} dependencies
 */
