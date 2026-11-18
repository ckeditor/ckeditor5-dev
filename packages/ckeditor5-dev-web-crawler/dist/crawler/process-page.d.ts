/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
import type { Cluster } from "puppeteer-cluster";
import type { Page } from "puppeteer";
import type { QueueData } from "../types.js";
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
export declare function processPage({ page, data, cluster, baseUrl, discoveredLinks, exclusions }: ProcessPageOptions): Promise<void>;
export {};
