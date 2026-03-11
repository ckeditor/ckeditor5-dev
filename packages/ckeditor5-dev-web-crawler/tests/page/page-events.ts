/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ConsoleMessage, Dialog, HTTPRequest, HTTPResponse, Page } from 'puppeteer';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ERROR_TYPES } from '../../src/constants.js';
import { REQUEST_ABORT_REASON, shouldAbortRequest } from '../../src/page/request-policy.js';
import type { CrawlerError, QueueData } from '../../src/types.js';

vi.mock( '../../src/page/request-policy.js' );

import { attachPageEventHandlers } from '../../src/page/page-events.js';

type EventHandler = ( payload: any ) => void | Promise<void>;

interface MockPage extends Page {
	emitEvent: ( eventName: string, payload: any ) => Promise<void>;
	onSpy: ReturnType<typeof vi.fn>;
	offSpy: ReturnType<typeof vi.fn>;
}

function createPageMock(): MockPage {
	const handlers = new Map<string, Set<EventHandler>>();
	const onSpy = vi.fn().mockImplementation( ( eventName: string, callback: EventHandler ) => {
		if ( !handlers.has( eventName ) ) {
			handlers.set( eventName, new Set() );
		}

		handlers.get( eventName )!.add( callback );
	} );

	const offSpy = vi.fn().mockImplementation( ( eventName: string, callback: EventHandler ) => {
		handlers.get( eventName )?.delete( callback );
	} );

	return {
		on: onSpy,
		off: offSpy,
		onSpy,
		offSpy,
		emitEvent: async ( eventName: string, payload: any ) => {
			for ( const handler of handlers.get( eventName ) || [] ) {
				await handler( payload );
			}
		}
	} as unknown as MockPage;
}

function createRequest( overrides: { url: () => string } & Record<string, unknown> ): HTTPRequest {
	return {
		resourceType: () => 'document',
		abort: () => Promise.resolve(),
		continue: () => Promise.resolve(),
		failure: () => null,
		response: () => null,
		method: () => 'GET',
		isNavigationRequest: () => false,
		frame: () => null,
		...overrides
	} as unknown as HTTPRequest;
}

describe( 'attachPageEventHandlers()', () => {
	const data: QueueData = {
		url: 'https://ckeditor.com/docs/start',
		parentUrl: 'https://ckeditor.com/docs',
		remainingNestedLevels: 1
	};

	beforeEach( () => {
		vi.clearAllMocks();
		vi.mocked( shouldAbortRequest ).mockReturnValue( false );
	} );

	test( 'handles request and dialog events and detaches listeners', async () => {
		const pageErrors: Array<CrawlerError> = [];
		const page = createPageMock();
		const detach = attachPageEventHandlers( { page, data, pageErrors } );

		const blockedRequest = createRequest( {
			url: () => 'https://ckeditor.com/docs/a',
			abort: vi.fn().mockResolvedValue( undefined ),
			continue: vi.fn().mockResolvedValue( undefined )
		} );

		const allowedRequest = createRequest( {
			url: () => 'https://ckeditor.com/docs/b',
			abort: vi.fn().mockResolvedValue( undefined ),
			continue: vi.fn().mockResolvedValue( undefined )
		} );

		vi.mocked( shouldAbortRequest )
			.mockReturnValueOnce( true )
			.mockReturnValueOnce( false );

		await page.emitEvent( 'request', blockedRequest );
		await page.emitEvent( 'request', allowedRequest );

		expect( blockedRequest.abort ).toHaveBeenCalledWith( REQUEST_ABORT_REASON );
		expect( blockedRequest.continue ).not.toHaveBeenCalled();
		expect( allowedRequest.continue ).toHaveBeenCalledTimes( 1 );

		const dialog = {
			dismiss: vi.fn().mockResolvedValue( undefined )
		} as unknown as Dialog;

		await page.emitEvent( 'dialog', dialog );
		expect( dialog.dismiss ).toHaveBeenCalledTimes( 1 );

		detach();
		expect( page.offSpy ).toHaveBeenCalledTimes( 7 );
	} );

	test( 'collects page crash and uncaught exception errors', async () => {
		const pageErrors: Array<CrawlerError> = [];
		const page = createPageMock();

		attachPageEventHandlers( { page, data, pageErrors } );

		await page.emitEvent( 'error', new Error( 'Renderer crashed' ) );
		await page.emitEvent( 'pageerror', { message: '' } );

		expect( pageErrors ).toEqual( [
			expect.objectContaining( {
				type: ERROR_TYPES.PAGE_CRASH,
				message: 'Renderer crashed'
			} ),
			expect.objectContaining( {
				type: ERROR_TYPES.UNCAUGHT_EXCEPTION,
				message: '(empty message)'
			} )
		] );
	} );

	test( 'collects request and response failures and skips known false positives', async () => {
		const pageErrors: Array<CrawlerError> = [];
		const page = createPageMock();

		attachPageEventHandlers( { page, data, pageErrors } );

		await page.emitEvent( 'requestfailed', createRequest( {
			url: () => 'https://ckeditor.com/docs/start',
			failure: () => ( { errorText: 'net::ERR_NAME_NOT_RESOLVED' } ),
			method: () => 'GET',
			isNavigationRequest: () => true,
			frame: () => ( {
				parentFrame: () => null
			} )
		} ) );

		await page.emitEvent( 'requestfailed', createRequest( {
			url: () => 'https://ckeditor.com/docs/post',
			failure: () => ( { errorText: 'some error' } ),
			response: () => ( { ok: () => true } ),
			method: () => 'POST'
		} ) );

		await page.emitEvent( 'requestfailed', createRequest( {
			url: () => 'https://ckeditor.com/docs/aborted',
			failure: () => ( { errorText: 'net::ERR_BLOCKED_BY_CLIENT' } )
		} ) );

		const response = {
			status: () => 500,
			url: () => 'https://ckeditor.com/assets/missing.css',
			request: () => createRequest( {
				url: () => 'https://ckeditor.com/assets/missing.css',
				isNavigationRequest: () => false,
				frame: () => null
			} )
		} as unknown as HTTPResponse;

		await page.emitEvent( 'response', response );

		await page.emitEvent( 'response', {
			status: () => 200,
			url: () => 'https://ckeditor.com/ok',
			request: () => createRequest( { url: () => 'https://ckeditor.com/ok' } )
		} );

		expect( pageErrors ).toHaveLength( 2 );
		expect( pageErrors[ 0 ]!.type ).toBe( ERROR_TYPES.REQUEST_FAILURE );
		expect( pageErrors[ 0 ]!.pageUrl ).toBe( data.parentUrl );
		expect( pageErrors[ 1 ]!.type ).toBe( ERROR_TYPES.RESPONSE_FAILURE );
		expect( pageErrors[ 1 ]!.pageUrl ).toBe( data.url );
	} );

	test( 'collects console errors and skips unsupported console messages', async () => {
		const pageErrors: Array<CrawlerError> = [];
		const page = createPageMock();

		attachPageEventHandlers( { page, data, pageErrors } );

		const consoleError = {
			type: () => 'error',
			args: () => [
				{
					remoteObject: () => ( { type: 'string', value: 'Main error\nstack line' } ),
					jsonValue: () => Promise.resolve( '' )
				}
			]
		} as unknown as ConsoleMessage;

		const nonError = {
			type: () => 'warning',
			args: () => []
		} as unknown as ConsoleMessage;

		const failedResourceMessage = {
			type: () => 'error',
			args: () => [
				{
					remoteObject: () => ( { type: 'string', value: 'Failed to load resource: net::ERR_FAILED' } ),
					jsonValue: () => Promise.resolve( '' )
				}
			]
		} as unknown as ConsoleMessage;

		await page.emitEvent( 'console', consoleError );
		await page.emitEvent( 'console', nonError );
		await page.emitEvent( 'console', failedResourceMessage );

		expect( pageErrors ).toHaveLength( 1 );
		expect( pageErrors[ 0 ]!.type ).toBe( ERROR_TYPES.CONSOLE_ERROR );
		expect( pageErrors[ 0 ]!.message ).toBe( 'Main error' );
	} );
} );
