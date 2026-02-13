/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Cluster } from 'puppeteer-cluster';
import type { Page } from 'puppeteer';
import { ERROR_TYPES } from '../constants.js';
import { getErrorIgnorePatternsFromPage, markErrorsAsIgnored } from '../errors/ignore-patterns.js';
import { attachPageEventHandlers } from '../page/page-events.js';
import { areSameUrl } from '../utils.js';
import type { CrawlerError, QueueData, RetryableCrawlerError } from '../types.js';
import { getLinksFromPage } from './get-links-from-page.js';

interface ProcessPageOptions {
	page: Page;
	data: QueueData;
	cluster: Cluster<QueueData, void>;
	baseUrl: string;
	discoveredLinks: Set<string>;
	exclusions: Array<string>;
}

/**
 * Crawls a single page, reports all discovered errors and queues new links.
 */
export async function processPage( { page, data, cluster, baseUrl, discoveredLinks, exclusions }: ProcessPageOptions ): Promise<void> {
	await page.setRequestInterception( true );

	const pageErrors: Array<CrawlerError> = [];
	const detachPageEventHandlers = attachPageEventHandlers( { page, data, pageErrors } );

	try {
		const pendingNavigationError = await getNavigationError( page, data.url );

		if ( pendingNavigationError && !hasNavigationRequestFailure( pageErrors, data.url ) ) {
			pageErrors.push( pendingNavigationError );
		}

		if ( data.remainingNestedLevels !== 0 ) {
			const links = await getLinksFromPage( { page, baseUrl, discoveredLinks, exclusions } );

			links.forEach( link => {
				if ( discoveredLinks.has( link ) ) {
					return;
				}

				discoveredLinks.add( link );

				cluster.queue( {
					url: link,
					parentUrl: data.url,
					remainingNestedLevels: data.remainingNestedLevels - 1
				} );
			} );
		}

		const nonIgnoredPageErrors = await getNonIgnoredErrors( page, pageErrors );

		if ( nonIgnoredPageErrors.length ) {
			throw createRetryableCrawlerError( data.url, nonIgnoredPageErrors );
		}
	} finally {
		detachPageEventHandlers();
	}
}

async function getNavigationError( page: Page, pageUrl: string ): Promise<CrawlerError | null> {
	try {
		// `networkidle0` forces loading CKEditor snippets. API pages to not contain them, so let's speed up.
		const waitUntil = pageUrl.includes( '/api/' ) ? 'load' : 'networkidle0';

		await page.goto( pageUrl, { waitUntil } );

		return null;
	} catch ( error: any ) {
		const message = error?.message || '(empty message)';

		return {
			pageUrl,
			type: ERROR_TYPES.NAVIGATION_ERROR,
			message
		};
	}
}

async function getNonIgnoredErrors( page: Page, pageErrors: Array<CrawlerError> ): Promise<Array<CrawlerError>> {
	if ( !pageErrors.length ) {
		return [];
	}

	// If page contains errors, check if there are any meta tags that define patterns to ignore errors.

	// Create patterns from meta tags to ignore errors.
	const errorIgnorePatterns = await getErrorIgnorePatternsFromPage( page );

	// Iterates over recently found errors to mark them as ignored ones, if they match the patterns.
	markErrorsAsIgnored( pageErrors, errorIgnorePatterns );

	return pageErrors.filter( error => !error.ignored );
}

function hasNavigationRequestFailure( pageErrors: Array<CrawlerError>, pageUrl: string ): boolean {
	return pageErrors.some( pageError => {
		return pageError.type === ERROR_TYPES.REQUEST_FAILURE &&
			pageError.failedResourceUrl &&
			areSameUrl( pageError.failedResourceUrl, pageUrl );
	} );
}

/**
 * Creates an error used to trigger a cluster-level retry when the page reported errors.
 */
function createRetryableCrawlerError( pageUrl: string, crawlerErrors: Array<CrawlerError> ): RetryableCrawlerError {
	const error = new Error(
		`Error crawling ${ pageUrl }: found ${ crawlerErrors.length } page ${ crawlerErrors.length > 1 ? 'errors' : 'error' }`
	) as RetryableCrawlerError;

	error.crawlerErrors = crawlerErrors;

	return error;
}
