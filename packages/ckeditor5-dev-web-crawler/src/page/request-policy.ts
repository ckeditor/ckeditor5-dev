/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { HTTPRequest } from 'puppeteer';
import { IGNORED_HOSTS } from '../constants.js';

export const REQUEST_ABORT_REASON = 'blockedbyclient';

/**
 * Returns true when request should be blocked by the crawler.
 */
export function shouldAbortRequest( request: HTTPRequest ): boolean {
	const { hostname, pathname } = new URL( request.url() );

	if ( !hostname ) {
		// Don't block requests without a hostname (e.g. data URLs).
		return false;
	}

	if ( request.resourceType() === 'media' ) {
		// Block all 'media' requests, as they are likely to fail anyway due to limitations in Puppeteer.
		return true;
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
