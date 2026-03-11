/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ErrorType } from './constants.js';

export interface CrawlerOptions {

	/**
	 * The URL to start crawling. This argument is required.
	 */
	url: string;

	/**
	 * Defines how many nested page levels should be examined. Infinity by default.
	 *
	 * @default Infinity
	 */
	depth?: number;

	/**
	 * An array of patterns to exclude links. Empty array by default to not exclude anything.
	 *
	 * @default []
	 */
	exclusions?: Array<string>;

	/**
	 * Timeout in milliseconds after which the crawler will stop crawling the page. 10 seconds by default.
	 *
	 * @default 10000
	 */
	timeout?: number;

	/**
	 * Number of concurrent pages (browser tabs) to be used during crawling.
	 *
	 * @default Math.min( numberOfCpuCores, 16 )
	 */
	concurrency?: number;

	/**
	 * Whether the browser should be created with the `--no-sandbox` flag.
	 *
	 * @default false
	 */
	disableBrowserSandbox?: boolean;

	/**
	 * Whether the browser should ignore invalid (self-signed) certificates.
	 *
	 * @default false
	 */
	ignoreHTTPSErrors?: boolean;

	/**
	 * Whether to display the current progress or only the result.
	 *
	 * @default false
	 */
	silent?: boolean;
}

export interface CrawlerError {
	pageUrl: string;
	type: ErrorType;
	message: string;
	failedResourceUrl?: string;
	ignored?: boolean;
}

export interface QueueData {
	url: string;
	parentUrl: string;
	remainingNestedLevels: number;
}

export interface ErrorCollection {
	pages: Set<string>;
	details?: string;
}

export interface RetryableCrawlerError extends Error {
	crawlerErrors: Array<CrawlerError>;
}
