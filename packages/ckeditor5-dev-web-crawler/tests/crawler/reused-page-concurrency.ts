/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Page } from 'puppeteer';
import { describe, expect, it, vi } from 'vitest';
import { ReusedPageConcurrency, busyPages } from '../../src/crawler/reused-page-concurrency.js';

type DialogHandler = ( dialog: any ) => void;

interface MockPage {
	isClosed: ReturnType<typeof vi.fn>;
	browser: ReturnType<typeof vi.fn>;
	removeAllListeners: ReturnType<typeof vi.fn>;
	on: ReturnType<typeof vi.fn>;
	off: ReturnType<typeof vi.fn>;
	evaluate: ReturnType<typeof vi.fn>;
	setRequestInterception: ReturnType<typeof vi.fn>;
	goto: ReturnType<typeof vi.fn>;
	close: ReturnType<typeof vi.fn>;
	dialogHandlers: Set<DialogHandler>;
}

interface MockBrowser {
	newPage: ReturnType<typeof vi.fn>;
	close: ReturnType<typeof vi.fn>;
	pages: Array<MockPage>;
}

function createBrowserMock(): MockBrowser {
	const browser: MockBrowser = {
		pages: [],
		newPage: vi.fn().mockImplementation( async () => {
			const page = createPageMock( browser );

			browser.pages.push( page );

			return page;
		} ),
		close: vi.fn().mockResolvedValue( undefined )
	};

	return browser;
}

function createPageMock( browser: MockBrowser ): MockPage {
	const page: MockPage = {
		dialogHandlers: new Set(),
		isClosed: vi.fn().mockReturnValue( false ),
		browser: vi.fn().mockReturnValue( browser ),
		removeAllListeners: vi.fn(),
		on: vi.fn().mockImplementation( ( eventName: string, handler: DialogHandler ) => {
			if ( eventName === 'dialog' ) {
				page.dialogHandlers.add( handler );
			}
		} ),
		off: vi.fn().mockImplementation( ( eventName: string, handler: DialogHandler ) => {
			if ( eventName === 'dialog' ) {
				page.dialogHandlers.delete( handler );
			}
		} ),
		evaluate: vi.fn().mockResolvedValue( undefined ),
		setRequestInterception: vi.fn().mockResolvedValue( undefined ),
		goto: vi.fn().mockResolvedValue( null ),
		close: vi.fn().mockResolvedValue( undefined )
	};

	return page;
}

async function createConcurrency() {
	const browser = createBrowserMock();
	const puppeteer = { launch: vi.fn().mockResolvedValue( browser ) };
	const concurrency = new ReusedPageConcurrency( {}, puppeteer );

	await concurrency.init();

	const worker = await concurrency.workerInstance();

	return { browser, puppeteer, concurrency, worker };
}

/**
 * Opens a page in the worker, like `puppeteer-cluster` does for every job, and returns the page and a function
 * that ends the job.
 */
async function openPage( worker: Awaited<ReturnType<typeof createConcurrency>>[ 'worker' ] ) {
	const job = await worker.jobInstance();

	return {
		page: job.resources.page as unknown as MockPage,
		close: () => job.close()
	};
}

describe( 'ReusedPageConcurrency', () => {
	it( 'opens a new tab when there is no idle tab', async () => {
		const { browser, worker } = await createConcurrency();

		const first = await openPage( worker );
		const second = await openPage( worker );

		expect( browser.newPage ).toHaveBeenCalledTimes( 2 );
		expect( browser.newPage ).toHaveBeenCalledWith( { type: 'window' } );
		expect( first.page ).not.toBe( second.page );
	} );

	it( 'resets the tab and reuses it for the next page', async () => {
		const { browser, worker } = await createConcurrency();

		const first = await openPage( worker );

		await first.close();

		const second = await openPage( worker );

		expect( browser.newPage ).toHaveBeenCalledTimes( 1 );
		expect( second.page ).toBe( first.page );
		expect( first.page.removeAllListeners ).toHaveBeenCalledWith( 'error' );
		expect( first.page.evaluate ).toHaveBeenCalledTimes( 1 );
		expect( first.page.setRequestInterception ).toHaveBeenCalledWith( false );
		expect( first.page.goto ).toHaveBeenCalledWith( 'about:blank' );
		expect( first.page.close ).not.toHaveBeenCalled();
		expect( first.page.dialogHandlers.size ).toBe( 0 );
	} );

	it( 'clears `sessionStorage` before leaving the previous page', async () => {
		const { worker } = await createConcurrency();
		const { page, close } = await openPage( worker );
		const clear = vi.fn();

		page.evaluate.mockImplementation( async callback => {
			vi.stubGlobal( 'sessionStorage', { clear } );
			callback();
		} );

		await close();

		expect( clear ).toHaveBeenCalledTimes( 1 );
		expect( page.evaluate.mock.invocationCallOrder[ 0 ] )
			.toBeLessThan( page.goto.mock.invocationCallOrder[ 0 ]! );
	} );

	it( 'ignores pages that do not allow access to `sessionStorage`', async () => {
		const { worker } = await createConcurrency();
		const { page, close } = await openPage( worker );

		page.evaluate.mockImplementation( async callback => {
			vi.stubGlobal( 'sessionStorage', {
				clear: () => {
					throw new Error( 'Access is denied for this document.' );
				}
			} );
			callback();
		} );

		await close();

		expect( page.close ).not.toHaveBeenCalled();
		expect( ( await openPage( worker ) ).page ).toBe( page );
	} );

	it( 'accepts `beforeunload` dialogs and dismisses other dialogs while resetting the tab', async () => {
		const { worker } = await createConcurrency();
		const { page, close } = await openPage( worker );

		const beforeUnloadDialog = {
			type: () => 'beforeunload',
			accept: vi.fn().mockRejectedValue( new Error( 'Dialog already handled.' ) ),
			dismiss: vi.fn().mockResolvedValue( undefined )
		};

		const alertDialog = {
			type: () => 'alert',
			accept: vi.fn().mockResolvedValue( undefined ),
			dismiss: vi.fn().mockRejectedValue( new Error( 'Dialog already handled.' ) )
		};

		page.goto.mockImplementation( async () => {
			for ( const handler of page.dialogHandlers ) {
				handler( beforeUnloadDialog );
				handler( alertDialog );
			}

			return null;
		} );

		await close();

		expect( beforeUnloadDialog.accept ).toHaveBeenCalledTimes( 1 );
		expect( beforeUnloadDialog.dismiss ).not.toHaveBeenCalled();
		expect( alertDialog.dismiss ).toHaveBeenCalledTimes( 1 );
		expect( alertDialog.accept ).not.toHaveBeenCalled();
		expect( page.dialogHandlers.size ).toBe( 0 );
	} );

	it( 'closes the tab instead of reusing it while its task is still running', async () => {
		const { browser, worker } = await createConcurrency();
		const first = await openPage( worker );

		busyPages.add( first.page as unknown as Page );

		try {
			await first.close();
		} finally {
			busyPages.delete( first.page as unknown as Page );
		}

		const second = await openPage( worker );

		expect( first.page.close ).toHaveBeenCalledTimes( 1 );
		expect( first.page.goto ).not.toHaveBeenCalled();
		expect( second.page ).not.toBe( first.page );
		expect( browser.newPage ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'closes the tab after its 50th page instead of resetting it', async () => {
		const { browser, worker } = await createConcurrency();
		let page: MockPage | undefined;

		for ( let i = 0; i < 50; i++ ) {
			const job = await openPage( worker );

			page ||= job.page;
			expect( job.page ).toBe( page );

			await job.close();
		}

		expect( page!.goto ).toHaveBeenCalledTimes( 49 );
		expect( page!.close ).toHaveBeenCalledTimes( 1 );

		const next = await openPage( worker );

		expect( next.page ).not.toBe( page );
		expect( browser.newPage ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'closes the tab when resetting it fails', async () => {
		const { worker } = await createConcurrency();
		const { page, close } = await openPage( worker );

		page.goto.mockRejectedValue( new Error( 'Navigation failed.' ) );

		await close();

		expect( page.close ).toHaveBeenCalledTimes( 1 );
		expect( ( await openPage( worker ) ).page ).not.toBe( page );
	} );

	it( 'closes the tab when resetting it takes too long', async () => {
		vi.useFakeTimers();

		try {
			const { worker } = await createConcurrency();
			const { page, close } = await openPage( worker );

			page.goto.mockReturnValue( new Promise( () => {} ) );

			const closing = close();

			await vi.advanceTimersByTimeAsync( 2000 );
			await closing;

			expect( page.close ).toHaveBeenCalledTimes( 1 );
			expect( page.dialogHandlers.size ).toBe( 0 );
			expect( ( await openPage( worker ) ).page ).not.toBe( page );
		} finally {
			vi.useRealTimers();
		}
	} );

	it( 'does not wait for the tab to close and ignores errors when closing it', async () => {
		const { worker } = await createConcurrency();
		const { page, close } = await openPage( worker );

		let closeCalls = 0;

		page.goto.mockRejectedValue( new Error( 'Navigation failed.' ) );

		// A plain function, because promises returned by `vi.fn()` mocks never count as unhandled rejections.
		( page as any ).close = () => {
			closeCalls++;

			return new Promise( ( resolve, reject ) => {
				setTimeout( () => reject( new Error( 'Target closed.' ) ), 0 );
			} );
		};

		// The job ends before the tab is closed.
		await expect( close() ).resolves.toBeUndefined();
		expect( closeCalls ).toBe( 1 );

		// Lets the rejection happen. If it was not handled, the test run would fail.
		await new Promise( resolve => setTimeout( resolve, 10 ) );
	} );

	it( 'does not reset or reuse a tab that is already closed', async () => {
		const { worker } = await createConcurrency();
		const { page, close } = await openPage( worker );

		page.isClosed.mockReturnValue( true );

		await close();

		expect( page.goto ).not.toHaveBeenCalled();
		expect( ( await openPage( worker ) ).page ).not.toBe( page );
	} );

	it( 'does not reuse an idle tab that was closed in the meantime', async () => {
		const { worker } = await createConcurrency();
		const first = await openPage( worker );

		await first.close();
		first.page.isClosed.mockReturnValue( true );

		const second = await openPage( worker );

		expect( second.page ).not.toBe( first.page );
	} );

	it( 'does not reuse idle tabs of a browser that was restarted', async () => {
		const { browser, puppeteer, worker } = await createConcurrency();
		const first = await openPage( worker );

		await first.close();

		const newBrowser = createBrowserMock();

		puppeteer.launch.mockResolvedValue( newBrowser );

		await worker.repair();

		const second = await openPage( worker );

		expect( browser.close ).toHaveBeenCalledTimes( 1 );
		expect( newBrowser.newPage ).toHaveBeenCalledTimes( 1 );
		expect( second.page ).not.toBe( first.page );
		expect( newBrowser.pages ).toContain( second.page );
	} );
} );
