/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Cluster } from 'puppeteer-cluster';
import type { LaunchOptions } from 'puppeteer';
import {
	DEFAULT_RETRIES,
	DEFAULT_RETRY_DELAY,
	ERROR_TYPES
} from '../constants.js';
import type { CrawlerError, QueueData } from '../types.js';

interface CreateCrawlerClusterOptions {
	timeout: number;
	concurrency: number;
	disableBrowserSandbox: boolean;
	ignoreHTTPSErrors: boolean;
	silent: boolean;
	onError: ( error: CrawlerError ) => void;
}

/**
 * Creates crawler cluster with all retries and global error handling configured.
 */
export async function createCrawlerCluster( {
	timeout,
	concurrency,
	disableBrowserSandbox,
	ignoreHTTPSErrors,
	silent,
	onError
}: CreateCrawlerClusterOptions ): Promise<Cluster<QueueData, void>> {
	const cluster: Cluster<QueueData, void> = await Cluster.launch( {
		concurrency: Cluster.CONCURRENCY_PAGE,
		timeout,
		retryLimit: DEFAULT_RETRIES,
		retryDelay: DEFAULT_RETRY_DELAY,
		maxConcurrency: concurrency,
		puppeteerOptions: createPuppeteerOptions( { disableBrowserSandbox, ignoreHTTPSErrors } ),
		skipDuplicateUrls: false,
		monitor: !silent
	} );

	cluster.on( 'taskerror', ( err, data, willRetry = false ) => {
		if ( willRetry ) {
			console.log( `Retrying ${ getUrlPathname( data.url ) }...` );
			return;
		}

		if ( err?.crawlerErrors ) {
			err.crawlerErrors.forEach( ( error: CrawlerError ) => onError( error ) );
			return;
		}

		onError( {
			pageUrl: data.url,
			type: ERROR_TYPES.PAGE_CRASH,
			message: err.message ? `Error crawling ${ getUrlPathname( data.url ) }: ${ err.message }` : '(empty message)'
		} );
	} );

	return cluster;
}

function createPuppeteerOptions( {
	disableBrowserSandbox,
	ignoreHTTPSErrors
}: {
	disableBrowserSandbox: boolean;
	ignoreHTTPSErrors: boolean;
} ): LaunchOptions {
	const puppeteerOptions = {
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
		puppeteerOptions.args.push( '--no-sandbox' );
		puppeteerOptions.args.push( '--disable-setuid-sandbox' );
	}

	return puppeteerOptions;
}

function getUrlPathname( url: string ): string {
	try {
		return new URL( url ).pathname;
	} catch {
		return url;
	}
}
