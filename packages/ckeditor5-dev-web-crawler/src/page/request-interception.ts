/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { HTTPRequest, Page } from 'puppeteer';
import { IGNORED_HOSTS } from '../constants.js';

/**
 * Enables request interception and blocks requests known to be irrelevant or noisy during crawling.
 */
export async function setupRequestInterception( page: Page ): Promise<() => void> {
	await page.setRequestInterception( true );
	const requestHandler = ( request: HTTPRequest ) => {
		if ( shouldAbortRequest( request ) ) {
			return request.abort( 'blockedbyclient' );
		}

		return request.continue();
	};

	page.on( 'request', requestHandler );

	return () => page.off( 'request', requestHandler );
}

function shouldAbortRequest( request: HTTPRequest ): boolean {
	if ( request.resourceType() === 'media' ) {
		// Block all 'media' requests, as they are likely to fail anyway due to limitations in Puppeteer.
		return true;
	}

	let parsedUrl: URL;

	try {
		parsedUrl = new URL( request.url() );
	} catch {
		return false;
	}

	const { hostname, pathname } = parsedUrl;

	if ( !hostname ) {
		// Don't block requests without a hostname (e.g. data URLs).
		return false;
	}

	if ( IGNORED_HOSTS.some( host => hostname.endsWith( host ) ) ) {
		// Block all requests to ignored hosts.
		return true;
	}

	if ( pathname.endsWith( 'api.json' ) ) {
		// This file is huge and loaded on every page, but isn't required during testing.
		return true;
	}

	return false;
}
