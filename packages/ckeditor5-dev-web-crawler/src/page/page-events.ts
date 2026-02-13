/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { styleText } from 'node:util';
import { ERROR_TYPES } from '../constants.js';
import { REQUEST_ABORT_REASON, shouldAbortRequest } from './request-policy.js';
import type { CrawlerError, QueueData } from '../types.js';
import type { ConsoleMessage, Dialog, HTTPRequest, HTTPResponse, Page } from 'puppeteer';

interface PageEventHandlersOptions {
	page: Page;
	data: QueueData;
	pageErrors: Array<CrawlerError>;
}

/**
 * Attaches Puppeteer listeners used by the crawler and returns a cleanup function.
 */
export function attachPageEventHandlers( { page, data, pageErrors }: PageEventHandlersOptions ): () => void {
	const onRequest = async ( request: HTTPRequest ): Promise<void> => {
		if ( shouldAbortRequest( request ) ) {
			await request.abort( REQUEST_ABORT_REASON );
			return;
		}

		await request.continue();
	};

	const onDialog = async ( dialog: Dialog ): Promise<void> => {
		await dialog.dismiss();
	};

	const onPageCrash = ( error: Error ): void => {
		pageErrors.push( {
			pageUrl: data.url,
			type: ERROR_TYPES.PAGE_CRASH,
			message: error?.message || '(empty message)'
		} );
	};

	const onUncaughtException = ( error: Error ): void => {
		pageErrors.push( {
			pageUrl: data.url,
			type: ERROR_TYPES.UNCAUGHT_EXCEPTION,
			message: error?.message || '(empty message)'
		} );
	};

	const onRequestFailure = ( request: HTTPRequest ): void => {
		const error = getRequestFailureError( request, data );

		if ( error ) {
			pageErrors.push( error );
		}
	};

	const onResponseFailure = ( response: HTTPResponse ): void => {
		const error = getResponseFailureError( response, data );

		if ( error ) {
			pageErrors.push( error );
		}
	};

	const onConsoleError = async ( message: ConsoleMessage ): Promise<void> => {
		const error = await getConsoleError( message, data );

		if ( error ) {
			pageErrors.push( error );
		}
	};

	page.on( 'request', onRequest );
	page.on( 'dialog', onDialog );
	page.on( ERROR_TYPES.PAGE_CRASH.event!, onPageCrash );
	page.on( ERROR_TYPES.UNCAUGHT_EXCEPTION.event!, onUncaughtException );
	page.on( ERROR_TYPES.REQUEST_FAILURE.event!, onRequestFailure );
	page.on( ERROR_TYPES.RESPONSE_FAILURE.event!, onResponseFailure );
	page.on( ERROR_TYPES.CONSOLE_ERROR.event!, onConsoleError );

	return () => {
		page.off( 'request', onRequest );
		page.off( 'dialog', onDialog );
		page.off( ERROR_TYPES.PAGE_CRASH.event!, onPageCrash );
		page.off( ERROR_TYPES.UNCAUGHT_EXCEPTION.event!, onUncaughtException );
		page.off( ERROR_TYPES.REQUEST_FAILURE.event!, onRequestFailure );
		page.off( ERROR_TYPES.RESPONSE_FAILURE.event!, onResponseFailure );
		page.off( ERROR_TYPES.CONSOLE_ERROR.event!, onConsoleError );
	};
}

function getRequestFailureError( request: HTTPRequest, data: QueueData ): CrawlerError | null {
	const errorText = request.failure()?.errorText;

	if ( request.response()?.ok() && request.method() === 'POST' ) {
		// Ignore a false positive due to a bug in Puppeteer.
		// https://github.com/puppeteer/puppeteer/issues/9458
		return null;
	}

	if ( errorText?.includes( 'net::ERR_BLOCKED_BY_CLIENT' ) ) {
		// Do not log errors explicitly aborted by the crawler.
		return null;
	}

	const url = request.url();
	const host = new URL( url ).host;
	const isNavigation = isTopLevelNavigationRequest( request );
	const message = isNavigation ?
		`Failed to open link ${ styleText( 'bold', url ) }` :
		`Failed to load resource from ${ styleText( 'bold', host ) }`;

	return {
		pageUrl: isNavigation ? data.parentUrl : data.url,
		type: ERROR_TYPES.REQUEST_FAILURE,
		message: `${ message } (failure message: ${ styleText( 'bold', errorText || '(empty message)' ) })`,
		failedResourceUrl: url
	};
}

function getResponseFailureError( response: HTTPResponse, data: QueueData ): CrawlerError | null {
	const responseStatus = response.status();

	if ( responseStatus <= 399 ) {
		return null;
	}

	const url = response.url();
	const host = new URL( url ).host;
	const isNavigation = isTopLevelNavigationRequest( response.request() );
	const message = isNavigation ?
		`Failed to open link ${ styleText( 'bold', url ) }` :
		`Failed to load resource from ${ styleText( 'bold', host ) }`;

	return {
		pageUrl: isNavigation ? data.parentUrl : data.url,
		type: ERROR_TYPES.RESPONSE_FAILURE,
		message: `${ message } (HTTP response status code: ${ styleText( 'bold', responseStatus.toString() ) })`,
		failedResourceUrl: url
	};
}

async function getConsoleError( message: ConsoleMessage, data: QueueData ): Promise<CrawlerError | null> {
	if ( message.type() !== 'error' ) {
		return null;
	}

	const serializedMessage = await Promise.all( message.args().map( arg => {
		const remoteObject = arg.remoteObject();

		if ( remoteObject.type === 'string' ) {
			return remoteObject.value;
		}

		if ( remoteObject.type === 'object' && remoteObject.subtype === 'error' ) {
			return remoteObject.description;
		}

		return arg.jsonValue();
	} ) );

	const text = serializedMessage.join( ' ' ).trim();

	if ( !text ) {
		return null;
	}

	if ( text.startsWith( 'Failed to load resource:' ) ) {
		// The resource loading failure is already covered by the "request" or "response" error handlers, so it should
		// not be also reported as the "console error".
		return null;
	}

	return {
		pageUrl: data.url,
		type: ERROR_TYPES.CONSOLE_ERROR,
		// First line of the message is the most important one, so we will use it as a message.
		message: text.split( '\n' )[ 0 ] || '(empty message)'
	};
}

/**
 * Checks, if HTTP request was a navigation one, i.e. request that is driving frame's navigation. Requests sent from child frames
 * (i.e. from <iframe>) are not treated as a navigation. Only a request from a top-level frame is navigation.
 */
function isTopLevelNavigationRequest( request: HTTPRequest ): boolean {
	const frame = request.frame();

	return request.isNavigationRequest() && frame !== null && frame.parentFrame() === null;
}
