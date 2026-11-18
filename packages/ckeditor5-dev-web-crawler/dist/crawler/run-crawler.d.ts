/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
import type { CrawlerOptions } from "../types.js";
/**
* Crawls the provided URL and all links found on the page. It uses Puppeteer to open the links in a headless browser and checks for errors.
*/
export declare function runCrawler(options: CrawlerOptions): Promise<void>;
