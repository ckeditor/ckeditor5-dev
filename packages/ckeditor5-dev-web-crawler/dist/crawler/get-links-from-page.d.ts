/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
import type { Page } from "puppeteer";
interface GetLinksFromPageOptions {
	page: Page;
	baseUrl: string;
	discoveredLinks: Set<string>;
	exclusions: Array<string>;
}
/**
* Finds all links in opened page and filters out external, already discovered and explicitly excluded ones.
*/
export declare function getLinksFromPage({ page, baseUrl, discoveredLinks, exclusions }: GetLinksFromPageOptions): Promise<Array<string>>;
export {};
