/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createRequire } from 'node:module';
import type { Dialog, Page } from 'puppeteer';
import type SingleBrowserImplementationType from 'puppeteer-cluster/dist/concurrency/SingleBrowserImplementation.js';
import type { ResourceData } from 'puppeteer-cluster/dist/concurrency/ConcurrencyImplementation.js';

// `puppeteer-cluster` is a CommonJS package that exports its base classes as `default` properties, and it does not
// expose them from its main entry point.
const require = createRequire( import.meta.url );
const SingleBrowserImplementation: typeof SingleBrowserImplementationType =
	require( 'puppeteer-cluster/dist/concurrency/SingleBrowserImplementation.js' ).default;

/**
 * How many pages a single tab opens before it is closed and replaced with a new one. Limits the impact of anything
 * a page leaves behind in the tab, like memory leaks.
 */
const MAX_PAGE_USES = 50;

/**
 * How long resetting a tab between pages may take before the tab is closed instead. It must stay well below
 * the 5 seconds that `puppeteer-cluster` gives `freeResources()` before it restarts the whole browser.
 */
const PAGE_RESET_TIMEOUT = 2000;

/**
 * Pages whose crawler task is still running. When a task times out, `puppeteer-cluster` frees its page without waiting
 * for the task to end, so such a page may still be used by the task and cannot be reused.
 */
export const busyPages: WeakSet<Page> = new WeakSet();

/**
 * Works like `Cluster.CONCURRENCY_PAGE` (all pages share one browser), but reuses browser tabs instead of opening
 * a new tab for every page. Opening a tab is expensive, and a reused tab can also keep using the same renderer process
 * when the next page comes from the same site.
 *
 * Between pages, a tab is reset to `about:blank`. A tab that cannot be reset, or that reached `MAX_PAGE_USES`,
 * is closed and replaced with a new one.
 */
export class ReusedPageConcurrency extends SingleBrowserImplementation {
	private readonly idlePages: Array<Page> = [];

	private readonly pageUses = new WeakMap<Page, number>();

	protected async createResources(): Promise<ResourceData> {
		while ( this.idlePages.length ) {
			const page = this.idlePages.pop()!;

			// After `puppeteer-cluster` restarts a broken browser, tabs of the old browser are unusable.
			if ( !page.isClosed() && page.browser() === this.browser ) {
				return { page };
			}
		}

		// In the full Chrome browser, background tabs sometimes never fire the `load` event, so every page gets its own
		// window. In `chrome-headless-shell`, every page is visible anyway, and this option has no effect.
		return { page: await this.browser!.newPage( { type: 'window' } ) };
	}

	protected async freeResources( { page }: ResourceData ): Promise<void> {
		const uses = ( this.pageUses.get( page ) || 0 ) + 1;

		this.pageUses.set( page, uses );

		if ( uses < MAX_PAGE_USES && !busyPages.has( page ) && await resetPage( page ) ) {
			this.idlePages.push( page );

			return;
		}

		// `puppeteer-cluster` restarts the whole browser when this method throws or takes too long, so closing the tab
		// is not awaited, and a tab that fails to close is ignored.
		page.close().catch( () => {} );
	}
}

/**
 * Prepares a tab for the next page and returns `false` if that failed.
 */
async function resetPage( page: Page ): Promise<boolean> {
	if ( page.isClosed() ) {
		return false;
	}

	// `puppeteer-cluster` adds an `error` listener for every job and never removes it.
	page.removeAllListeners( 'error' );

	// The crawler's own dialog handler is already detached, and an open dialog would block the navigation.
	// The `beforeunload` dialog must be accepted, because dismissing it cancels the navigation.
	const onDialog = ( dialog: Dialog ) => {
		const result = dialog.type() === 'beforeunload' ? dialog.accept() : dialog.dismiss();

		result.catch( () => {} );
	};

	page.on( 'dialog', onDialog );

	const reset = ( async () => {
		// Cookies and `localStorage` are shared by all tabs anyway, but `sessionStorage` belongs to the tab. Without
		// clearing it, a reused tab would carry state over from the previous page. Pages such as `chrome-error://` do
		// not allow access to `sessionStorage`, but they have nothing to clear either.
		// This clears only the storage of the page's own origin, and the page can still write to it while it unloads
		// (for example, in a `pagehide` handler), so a reused tab is not as clean as a new one.
		await page.evaluate( () => {
			try {
				sessionStorage.clear();
			} catch {
				// Nothing to clear.
			}
		} );

		// Disabling the interception lets requests that the previous page started after the crawler detached its
		// request handler finish, instead of leaving them paused.
		await page.setRequestInterception( false );
		await page.goto( 'about:blank' );
	} )();

	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	const timeout = new Promise<never>( ( resolve, reject ) => {
		timeoutId = setTimeout( () => reject( new Error( 'Resetting the page timed out.' ) ), PAGE_RESET_TIMEOUT );
	} );

	try {
		await Promise.race( [ reset, timeout ] );

		return true;
	} catch {
		// `Promise.race()` also handles a rejection of the reset that comes after the timeout.
		return false;
	} finally {
		clearTimeout( timeoutId );
		page.off( 'dialog', onDialog );
	}
}
