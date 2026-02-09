/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { styleText } from 'node:util';
import { Cluster } from 'puppeteer-cluster';
import type { LaunchOptions } from 'puppeteer';

import {
	DEFAULT_CONCURRENCY,
	DEFAULT_RETRIES,
	DEFAULT_RETRY_DELAY,
	DEFAULT_TIMEOUT,
	ERROR_TYPES
} from '../constants.js';
import { logErrors } from '../errors/error-reporter.js';
import { getErrorHandler, type ErrorStore } from '../errors/error-store.js';
import { createRetryableCrawlerError, isRetryableCrawlerError } from '../errors/retryable-crawler-error.js';
import { getBaseUrl } from '../utils.js';
import type { CrawlerOptions, QueueData } from '../types.js';
import { processPage } from './process-page.js';

/**
 * Crawls the provided URL and all links found on the page. It uses Puppeteer to open the links in a headless browser and checks for errors.
 */
export async function runCrawler( options: CrawlerOptions ): Promise<void> {
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

	console.log( styleText( 'bold', '\n🔎 Starting the Crawler…\n' ) );

	const discoveredLinks = new Set( [ url ] );
	const errors: ErrorStore = new Map();
	const baseUrl = getBaseUrl( url );
	const onError = getErrorHandler( errors );

	const cluster: Cluster<QueueData, void> = await Cluster.launch( {
		concurrency: Cluster.CONCURRENCY_PAGE,
		timeout,
		retryLimit: DEFAULT_RETRIES,
		retryDelay: DEFAULT_RETRY_DELAY,
		maxConcurrency: concurrency,
		puppeteerOptions: getPuppeteerOptions( { disableBrowserSandbox, ignoreHTTPSErrors } ),
		skipDuplicateUrls: false,
		monitor: !silent
	} );

	cluster.on( 'taskerror', ( err, data, willRetry = false ) => {
		const crawlUrl = new URL( data.url );

		if ( willRetry ) {
			console.log( `Retrying ${ crawlUrl.pathname }...` );
			return;
		}

		if ( isRetryableCrawlerError( err ) ) {
			err.crawlerErrors.forEach( error => onError( error ) );
			return;
		}

		onError( {
			pageUrl: crawlUrl.href,
			type: ERROR_TYPES.PAGE_CRASH,
			message: err.message ? `Error crawling ${ crawlUrl.pathname }: ${ err.message }` : '(empty message)'
		} );
	} );

	await cluster.task( async ( { page, data } ) => {
		const nonIgnoredPageErrors = await processPage( {
			page,
			data,
			baseUrl,
			discoveredLinks,
			exclusions,
			queue: data => cluster.queue( data )
		} );

		if ( nonIgnoredPageErrors.length ) {
			throw createRetryableCrawlerError( data.url, nonIgnoredPageErrors );
		}
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

function getPuppeteerOptions( {
	disableBrowserSandbox,
	ignoreHTTPSErrors
}: {
	disableBrowserSandbox: boolean;
	ignoreHTTPSErrors: boolean;
} ): LaunchOptions {
	const options = {
		args: [
			'--disable-extensions', // Disables all browser extensions.
			'--disable-plugins', // Disables all plugins.
			'--disable-gpu', // Disables GPU hardware acceleration.
			'--disable-software-rasterizer', // Disables software fallback for GPU rendering.
			'--disable-renderer-backgrounding', // Prevents throttling of background tabs renderers.
			'--disable-background-timer-throttling', // Stops throttling of JavaScript timers in background tabs.
			'--disable-backgrounding-occluded-windows', // Avoids deprioritizing windows that are not visible.
			'--disable-sync', // Disables browser sync services.
			'--disable-translate', // Disables built-in translation features.
			'--disable-infobars', // Hides infobars (e.g., automation warnings).
			'--no-first-run', // Skips first run tasks and setup dialogs.
			'--no-default-browser-check' // Prevents default browser check at startup.
		],
		headless: true,
		acceptInsecureCerts: ignoreHTTPSErrors
	} satisfies LaunchOptions;

	if ( disableBrowserSandbox ) {
		options.args.push( '--no-sandbox' );
		options.args.push( '--disable-setuid-sandbox' );
	}

	return options;
}
