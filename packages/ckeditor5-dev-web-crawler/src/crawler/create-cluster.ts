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
import { ReusedPageConcurrency } from './reused-page-concurrency.js';

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
		concurrency: ReusedPageConcurrency,
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
			if ( !silent ) {
				console.log( `Retrying ${ getUrlPathname( data.url ) }...` );
			}

			return;
		}

		if ( err?.crawlerErrors ) {
			err.crawlerErrors.forEach( ( error: CrawlerError ) => onError( error ) );
			return;
		}

		onError( {
			pageUrl: data.url,
			type: ERROR_TYPES.PAGE_CRASH,
			message: err?.message ? `Error crawling ${ getUrlPathname( data.url ) }: ${ err.message }` : '(empty message)'
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
		// Puppeteer already passes the common automation flags by default (for example, `--disable-extensions`
		// and `--no-first-run`), so only the flags missing from its defaults are listed here.
		args: [
			'--disable-software-rasterizer', // Disables software fallback for GPU rendering.
			'--no-default-browser-check', // Prevents default browser check at startup.
			// To keep the previous page in the back/forward cache, the full Chrome browser can start a new renderer process
			// for every navigation of a reused page, which takes a lot of CPU.
			'--disable-back-forward-cache'
		],
		// `chrome-headless-shell` is a separate, lighter Chrome build for automation, which uses noticeably less CPU.
		headless: 'shell',
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
