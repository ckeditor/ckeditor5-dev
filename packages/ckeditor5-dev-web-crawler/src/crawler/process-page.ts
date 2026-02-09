/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Page } from 'puppeteer';
import { ERROR_TYPES } from '../constants.js';
import { getErrorIgnorePatternsFromPage, markErrorsAsIgnored } from '../errors/error-ignore-patterns.js';
import { attachPageErrorListeners } from '../page/page-error-listeners.js';
import { getLinksFromPage } from '../page/links-from-page.js';
import { setupRequestInterception } from '../page/request-interception.js';
import { areSameUrl } from '../utils.js';
import type { CrawlerError, QueueData } from '../types.js';

interface ProcessPageOptions {
	page: Page;
	data: QueueData;
	baseUrl: string;
	discoveredLinks: Set<string>;
	exclusions: Array<string>;
	queue: ( data: QueueData ) => void;
}

/**
 * Processes a single page and returns non-ignored errors found during that processing.
 */
export async function processPage( options: ProcessPageOptions ): Promise<Array<CrawlerError>> {
	const { page, data, baseUrl, discoveredLinks, exclusions, queue } = options;
	const pageErrors: Array<CrawlerError> = [];
	const removeRequestInterceptionListener = await setupRequestInterception( page );
	const removePageErrorListeners = attachPageErrorListeners( page, data, pageErrors );

	try {
		const pendingNavigationError = await tryNavigateToPage( page, data.url );

		if ( pendingNavigationError && !hasNavigationRequestFailure( pageErrors, data.url ) ) {
			pageErrors.push( pendingNavigationError );
		}

		if ( data.remainingNestedLevels !== 0 ) {
			const links = await getLinksFromPage( page, { baseUrl, discoveredLinks, exclusions } );

			links.forEach( link => {
				if ( discoveredLinks.has( link ) ) {
					return;
				}

				discoveredLinks.add( link );

				queue( {
					url: link,
					parentUrl: data.url,
					remainingNestedLevels: data.remainingNestedLevels - 1
				} );
			} );
		}

		if ( !pageErrors.length ) {
			return [];
		}

		// If page contains errors, check if there are any meta tags that define patterns to ignore errors.
		const errorIgnorePatterns = await getErrorIgnorePatternsFromPage( page );

		// Iterate over recently found errors to mark them as ignored ones, if they match the patterns.
		markErrorsAsIgnored( pageErrors, errorIgnorePatterns );

		return pageErrors.filter( error => !error.ignored );
	} finally {
		removePageErrorListeners();
		removeRequestInterceptionListener();
	}
}

async function tryNavigateToPage( page: Page, url: string ): Promise<CrawlerError | null> {
	try {
		// `networkidle0` forces loading CKEditor snippets. API pages do not contain them, so let's speed up.
		const waitUntil = url.includes( '/api/' ) ? 'load' : 'networkidle0';

		await page.goto( url, { waitUntil } );

		return null;
	} catch ( error ) {
		const errorMessage = ( error as Error ).message || '(empty message)';

		return {
			pageUrl: url,
			type: ERROR_TYPES.NAVIGATION_ERROR,
			message: errorMessage
		};
	}
}

function hasNavigationRequestFailure( pageErrors: Array<CrawlerError>, pageUrl: string ): boolean {
	return pageErrors.some( pageError => {
		return pageError.type === ERROR_TYPES.REQUEST_FAILURE &&
			pageError.failedResourceUrl &&
			areSameUrl( pageError.failedResourceUrl, pageUrl );
	} );
}
