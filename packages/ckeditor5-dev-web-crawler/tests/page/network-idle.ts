/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { EventEmitter } from 'node:events';
import type { HTTPRequest, Page } from 'puppeteer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackNetworkIdle } from '../../src/page/network-idle.js';

const IDLE_TIME = 250;

function createRequest( failure: { errorText: string } | null = null ): HTTPRequest {
	return { failure: () => failure } as unknown as HTTPRequest;
}

describe( 'trackNetworkIdle()', () => {
	let page: EventEmitter;
	let isIdle: boolean;

	beforeEach( () => {
		vi.useFakeTimers();

		page = Object.assign( new EventEmitter(), { isClosed: () => false } );
		isIdle = false;
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	function waitForIdle( tracker: ReturnType<typeof trackNetworkIdle> ): Promise<void> {
		return tracker.waitForIdle( IDLE_TIME ).then( () => {
			isIdle = true;
		} );
	}

	it( 'resolves once no request has been in flight for the idle time', async () => {
		const tracker = trackNetworkIdle( page as unknown as Page );

		waitForIdle( tracker );

		await vi.advanceTimersByTimeAsync( IDLE_TIME - 1 );
		expect( isIdle ).toBe( false );

		await vi.advanceTimersByTimeAsync( 1 );
		expect( isIdle ).toBe( true );
	} );

	it( 'counts requests started before waiting', async () => {
		const tracker = trackNetworkIdle( page as unknown as Page );
		const request = createRequest();

		page.emit( 'request', request );
		waitForIdle( tracker );

		await vi.advanceTimersByTimeAsync( IDLE_TIME );
		expect( isIdle ).toBe( false );

		page.emit( 'requestfinished', request );

		await vi.advanceTimersByTimeAsync( IDLE_TIME );
		expect( isIdle ).toBe( true );
	} );

	it( 'ignores a request that failed before its `request` event', async () => {
		const tracker = trackNetworkIdle( page as unknown as Page );
		const request = createRequest( { errorText: 'net::ERR_ABORTED' } );

		waitForIdle( tracker );
		page.emit( 'requestfailed', request );
		page.emit( 'request', request );

		await vi.advanceTimersByTimeAsync( IDLE_TIME );
		expect( isIdle ).toBe( true );
	} );

	it( 'counts a request as in flight until its body has loaded, not only until its response arrives', async () => {
		const tracker = trackNetworkIdle( page as unknown as Page );
		const request = createRequest();

		waitForIdle( tracker );
		page.emit( 'request', request );
		page.emit( 'response', { request: () => request } );

		await vi.advanceTimersByTimeAsync( IDLE_TIME );
		expect( isIdle ).toBe( false );

		page.emit( 'requestfinished', request );

		await vi.advanceTimersByTimeAsync( IDLE_TIME );
		expect( isIdle ).toBe( true );
	} );

	it( 'treats failed requests as finished', async () => {
		const tracker = trackNetworkIdle( page as unknown as Page );
		const request = createRequest();

		waitForIdle( tracker );
		page.emit( 'request', request );
		page.emit( 'requestfailed', request );

		await vi.advanceTimersByTimeAsync( IDLE_TIME );
		expect( isIdle ).toBe( true );
	} );

	it( 'restarts the idle time when a new request starts and finishes', async () => {
		const tracker = trackNetworkIdle( page as unknown as Page );
		const request = createRequest();

		waitForIdle( tracker );

		await vi.advanceTimersByTimeAsync( IDLE_TIME - 1 );

		page.emit( 'request', request );
		page.emit( 'requestfinished', request );

		await vi.advanceTimersByTimeAsync( IDLE_TIME - 1 );
		expect( isIdle ).toBe( false );

		await vi.advanceTimersByTimeAsync( 1 );
		expect( isIdle ).toBe( true );
	} );

	it( 'rejects when the page is closed while waiting', async () => {
		const tracker = trackNetworkIdle( page as unknown as Page );
		const idle = tracker.waitForIdle( IDLE_TIME );

		page.emit( 'request', createRequest() );
		page.emit( 'close' );

		await expect( idle ).rejects.toThrow( 'The page was closed while waiting for the network to be idle.' );
	} );

	it( 'rejects when the page was closed before waiting', async () => {
		const tracker = trackNetworkIdle( page as unknown as Page );

		page.emit( 'close' );
		Object.assign( page, { isClosed: () => true } );

		await expect( tracker.waitForIdle( IDLE_TIME ) ).rejects.toThrow(
			'The page was closed while waiting for the network to be idle.'
		);
	} );

	it( 'removes its listeners and timer when stopped', async () => {
		const tracker = trackNetworkIdle( page as unknown as Page );

		waitForIdle( tracker );
		tracker.stop();

		expect( page.eventNames() ).toEqual( [] );
		expect( vi.getTimerCount() ).toBe( 0 );
	} );
} );
