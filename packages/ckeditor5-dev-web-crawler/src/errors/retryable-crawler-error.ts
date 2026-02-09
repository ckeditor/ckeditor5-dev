/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { CrawlerError } from '../types.js';

export interface RetryableCrawlerError extends Error {
	crawlerErrors: Array<CrawlerError>;
}

/**
 * Creates an error used to trigger a cluster-level retry when the page reported errors.
 */
export function createRetryableCrawlerError( pageUrl: string, crawlerErrors: Array<CrawlerError> ): RetryableCrawlerError {
	const error = new Error(
		`Error crawling ${ pageUrl }: found ${ crawlerErrors.length } page ${ crawlerErrors.length > 1 ? 'errors' : 'error' }`
	) as RetryableCrawlerError;

	error.crawlerErrors = crawlerErrors;

	return error;
}

/**
 * Checks if the provided error stores crawler errors that should be reported after all retry attempts failed.
 */
export function isRetryableCrawlerError( error: unknown ): error is RetryableCrawlerError {
	if ( !error || typeof error !== 'object' ) {
		return false;
	}

	return Array.isArray( ( error as RetryableCrawlerError ).crawlerErrors );
}
