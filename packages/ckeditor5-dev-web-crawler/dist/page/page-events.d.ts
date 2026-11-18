/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
import type { CrawlerError, QueueData } from "../types.js";
import type { Page } from "puppeteer";
interface PageEventHandlersOptions {
	page: Page;
	data: QueueData;
	pageErrors: Array<CrawlerError>;
}
/**
* Attaches Puppeteer listeners used by the crawler and returns a cleanup function.
*/
export declare function attachPageEventHandlers({ page, data, pageErrors }: PageEventHandlersOptions): () => void;
export {};
