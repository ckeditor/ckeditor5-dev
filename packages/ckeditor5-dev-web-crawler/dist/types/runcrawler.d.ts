#!/usr/bin/env node
/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
interface CrawlerOptions {
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
     * Number of concurrent pages (browser tabs) to be used during crawling. One by default.
     *
     * @default Half of the number of CPU cores.
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
    noSpinner?: boolean;
}
/**
 * Crawls the provided URL and all links found on the page. It uses Puppeteer to open the links in a headless browser and checks for errors.
 */
export default function runCrawler(options: CrawlerOptions): Promise<void>;
export {};
