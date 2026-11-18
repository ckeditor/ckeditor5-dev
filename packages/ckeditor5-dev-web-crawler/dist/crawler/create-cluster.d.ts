/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
import { Cluster } from "puppeteer-cluster";
import type { CrawlerError, QueueData } from "../types.js";
interface CreateCrawlerClusterOptions {
	timeout: number;
	concurrency: number;
	reuseTabs: boolean;
	disableBrowserSandbox: boolean;
	ignoreHTTPSErrors: boolean;
	silent: boolean;
	onError: (error: CrawlerError) => void;
}
/**
* Creates crawler cluster with all retries and global error handling configured.
*/
export declare function createCrawlerCluster({ timeout, concurrency, reuseTabs, disableBrowserSandbox, ignoreHTTPSErrors, silent, onError }: CreateCrawlerClusterOptions): Promise<Cluster<QueueData, void>>;
export {};
