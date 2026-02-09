/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Page } from 'puppeteer';
import { DATA_ATTRIBUTE_NAME } from '../constants.js';
import { getAllLinks } from '../getlinks.js';

interface GetLinksFromPageOptions {
	baseUrl: string;
	discoveredLinks: Set<string>;
	exclusions: Array<string>;
}

/**
 * Finds all links in opened page and filters out external, already discovered and explicitly excluded ones.
 */
export async function getLinksFromPage( page: Page, {
	baseUrl,
	discoveredLinks,
	exclusions
}: GetLinksFromPageOptions ): Promise<Array<string>> {
	const links = await page.evaluate( getAllLinks, DATA_ATTRIBUTE_NAME );

	return links.filter( link => {
		return link.startsWith( baseUrl ) && // Skip external link.
			!discoveredLinks.has( link ) && // Skip already discovered link.
			!exclusions.some( exclusion => link.includes( exclusion ) ); // Skip explicitly excluded link.
	} );
}
