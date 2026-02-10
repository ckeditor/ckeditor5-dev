/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { styleText } from 'node:util';
import {
	DEFAULT_CONCURRENCY,
	DEFAULT_TIMEOUT
} from '../constants.js';
import { logErrors } from '../errors/reporter.js';
import { createErrorCollector, createErrorStore, type ErrorStore } from '../errors/error-store.js';
import { getBaseUrl } from '../utils.js';
import type { CrawlerOptions } from '../types.js';
import { createCrawlerCluster } from './create-cluster.js';
import { processPage } from './process-page.js';

/**
 * Crawls the provided URL and all links found on the page. It uses Puppeteer to open the links in a headless browser and checks for errors.
 */
export async function runCrawler( options: CrawlerOptions ): Promise<ErrorStore> {
	console.log( styleText( 'bold', '\n🔎 Starting the Crawler…\n' ) );

	const {
		url,
		depth = Infinity,
		exclusions = [],
		timeout = DEFAULT_TIMEOUT,
		concurrency = DEFAULT_CONCURRENCY,
		disableBrowserSandbox = false,
		ignoreHTTPSErrors = false,
		silent = false
	} = options;

	const discoveredLinks = new Set( [ url ] );
	const errors = createErrorStore();
	const baseUrl = getBaseUrl( url );
	const onError = createErrorCollector( errors );

	const cluster = await createCrawlerCluster( {
		timeout,
		concurrency,
		disableBrowserSandbox,
		ignoreHTTPSErrors,
		silent,
		onError
	} );

	await cluster.task( async ( { page, data } ) => {
		await processPage( {
			page,
			data,
			cluster,
			baseUrl,
			discoveredLinks,
			exclusions
		} );
	} );

	// Queue the first link to be crawled.
	cluster.queue( {
		url,
		parentUrl: '(none)',
		remainingNestedLevels: depth
	} );

	await cluster.idle();
	await cluster.close();

	logErrors( errors );

	process.exit( errors.size ? 1 : 0 );
}
