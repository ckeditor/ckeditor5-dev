/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

const FINISHED_STATUSES = [
	'success',
	'failed',
	'failed_parent',
	// See: https://github.com/ckeditor/ckeditor5/issues/18359.
	'skipped'
];

/**
 * Checks if a workflow could be considered as finished based on its jobs.
 *
 * @param {Array.<object>} jobs
 * @returns {boolean}
 */
export default function isWorkflowFinished( jobs ) {
	return jobs.every( job => FINISHED_STATUSES.includes( job.status ) );
}
