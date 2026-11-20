/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { HTTPRequest, Page } from 'puppeteer';

interface NetworkIdleTracker {
	waitForIdle: ( idleTime: number, timeout: number ) => Promise<void>;
	stop: () => void;
}

/**
 * Starts tracking the requests of the page. `waitForIdle()` resolves once no request has been in flight for `idleTime`,
 * and rejects if that does not happen within `timeout`.
 *
 * Unlike in `page.waitForNetworkIdle()`, which counts a request as finished once its response headers arrive, a request
 * counts as in flight until its response body has loaded or the request has failed, like in Chrome's `networkidle0`.
 * Otherwise, the crawler could miss errors thrown by scripts that process a slowly loading response.
 */
export function trackNetworkIdle( page: Page ): NetworkIdleTracker {
	const inflightRequests = new Set<HTTPRequest>();
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	let maxWaitTimeoutId: ReturnType<typeof setTimeout> | undefined;
	let onChange = (): void => {};
	let onClose = (): void => {};

	const onRequest = ( request: HTTPRequest ): void => {
		// Puppeteer may emit the `request` event of an intercepted request after its `requestfailed` event,
		// for example when the request was aborted because its frame navigated away.
		if ( request.failure() ) {
			return;
		}

		inflightRequests.add( request );
		onChange();
	};

	const onRequestDone = ( request: HTTPRequest ): void => {
		inflightRequests.delete( request );
		onChange();
	};

	const onPageClose = (): void => onClose();

	page.on( 'request', onRequest );
	page.on( 'requestfinished', onRequestDone );
	page.on( 'requestfailed', onRequestDone );
	page.on( 'close', onPageClose );

	return {
		// Failing before the crawler's task times out reports the pending requests together with the other page errors.
		waitForIdle: ( idleTime, timeout ) => new Promise( ( resolve, reject ) => {
			onClose = () => reject( new Error( 'The page was closed while waiting for the network to be idle.' ) );

			if ( page.isClosed() ) {
				return onClose();
			}

			onChange = () => {
				clearTimeout( timeoutId );

				if ( !inflightRequests.size ) {
					timeoutId = setTimeout( resolve, idleTime );
				}
			};

			maxWaitTimeoutId = setTimeout( () => {
				const pendingUrls = Array.from( inflightRequests, request => request.url() ).join( ', ' );

				reject( new Error( `The network was not idle within ${ timeout } ms. Pending requests: ${ pendingUrls }` ) );
			}, timeout );
			onChange();
		} ),

		stop: () => {
			clearTimeout( timeoutId );
			clearTimeout( maxWaitTimeoutId );
			page.off( 'request', onRequest );
			page.off( 'requestfinished', onRequestDone );
			page.off( 'requestfailed', onRequestDone );
			page.off( 'close', onPageClose );
		}
	};
}
