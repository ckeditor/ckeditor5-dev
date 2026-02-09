/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { styleText } from 'node:util';
import type { ConsoleMessage, Dialog, HTTPRequest, HTTPResponse, Page } from 'puppeteer';
import { ERROR_TYPES } from '../constants.js';
import type { CrawlerError, QueueData } from '../types.js';

/**
 * Attaches page event listeners and stores all discovered crawler errors in the provided collection.
 */
export function attachPageErrorListeners( page: Page, data: QueueData, pageErrors: Array<CrawlerError> ): () => void {
	const pageCrashEvent = ERROR_TYPES.PAGE_CRASH.event!;
	const uncaughtExceptionEvent = ERROR_TYPES.UNCAUGHT_EXCEPTION.event!;
	const requestFailureEvent = ERROR_TYPES.REQUEST_FAILURE.event!;
	const responseFailureEvent = ERROR_TYPES.RESPONSE_FAILURE.event!;
	const consoleErrorEvent = ERROR_TYPES.CONSOLE_ERROR.event!;

	const onDialog = ( dialog: Dialog ) => dialog.dismiss();
	const onPageCrash = ( error: Error ) => {
		pageErrors.push( {
			pageUrl: data.url,
			type: ERROR_TYPES.PAGE_CRASH,
			message: error.message || '(empty message)'
		} );
	};
	const onUncaughtException = ( error: Error ) => {
		pageErrors.push( {
			pageUrl: data.url,
			type: ERROR_TYPES.UNCAUGHT_EXCEPTION,
			message: error.message || '(empty message)'
		} );
	};
	const onRequestFailure = ( request: HTTPRequest ) => {
		recordRequestFailure( request, data, pageErrors );
	};
	const onResponseFailure = ( response: HTTPResponse ) => {
		recordResponseFailure( response, data, pageErrors );
	};
	const onConsoleError = async ( message: ConsoleMessage ) => {
		const error = await createConsoleError( message, data.url );

		if ( error ) {
			pageErrors.push( error );
		}
	};

	page.on( 'dialog', onDialog );
	page.on( pageCrashEvent, onPageCrash );
	page.on( uncaughtExceptionEvent, onUncaughtException );
	page.on( requestFailureEvent, onRequestFailure );
	page.on( responseFailureEvent, onResponseFailure );
	page.on( consoleErrorEvent, onConsoleError );

	return () => {
		page.off( 'dialog', onDialog );
		page.off( pageCrashEvent, onPageCrash );
		page.off( uncaughtExceptionEvent, onUncaughtException );
		page.off( requestFailureEvent, onRequestFailure );
		page.off( responseFailureEvent, onResponseFailure );
		page.off( consoleErrorEvent, onConsoleError );
	};
}

/**
 * Checks if HTTP request was a navigation one, i.e. request that is driving frame's navigation. Requests sent from child frames
 * (i.e. from <iframe>) are not treated as a navigation. Only a request from a top-level frame is navigation.
 */
export function isNavigationRequest( request: HTTPRequest ): boolean {
	const frame = request.frame();

	return request.isNavigationRequest() && !!frame && frame.parentFrame() === null;
}

function recordRequestFailure( request: HTTPRequest, data: QueueData, pageErrors: Array<CrawlerError> ): void {
	const errorText = request.failure()?.errorText;

	if ( request.response()?.ok() && request.method() === 'POST' ) {
		// Ignore a false positive due to a bug in Puppeteer.
		// https://github.com/puppeteer/puppeteer/issues/9458
		return;
	}

	if ( errorText?.includes( 'net::ERR_BLOCKED_BY_CLIENT' ) ) {
		// Do not log errors explicitly aborted by the crawler.
		return;
	}

	const url = request.url();
	const host = getHostForLogs( url );
	const navigationRequest = isNavigationRequest( request );
	const message = navigationRequest ?
		`Failed to open link ${ styleText( 'bold', url ) }` :
		`Failed to load resource from ${ styleText( 'bold', host ) }`;

	pageErrors.push( {
		pageUrl: navigationRequest ? data.parentUrl : data.url,
		type: ERROR_TYPES.REQUEST_FAILURE,
		message: `${ message } (failure message: ${ styleText( 'bold', ( errorText || '(empty message)' ).toString() ) })`,
		failedResourceUrl: url
	} );
}

function recordResponseFailure( response: HTTPResponse, data: QueueData, pageErrors: Array<CrawlerError> ): void {
	const responseStatus = response.status();

	if ( responseStatus <= 399 ) {
		return;
	}

	const url = response.url();
	const host = getHostForLogs( url );
	const navigationRequest = isNavigationRequest( response.request() );
	const message = navigationRequest ?
		`Failed to open link ${ styleText( 'bold', url ) }` :
		`Failed to load resource from ${ styleText( 'bold', host ) }`;

	pageErrors.push( {
		pageUrl: navigationRequest ? data.parentUrl : data.url,
		type: ERROR_TYPES.RESPONSE_FAILURE,
		message: `${ message } (HTTP response status code: ${ styleText( 'bold', responseStatus.toString() ) })`,
		failedResourceUrl: url
	} );
}

async function createConsoleError( message: ConsoleMessage, pageUrl: string ): Promise<CrawlerError | null> {
	if ( message.type() !== 'error' ) {
		return null;
	}

	const text = await serializeConsoleMessage( message );

	if ( !text ) {
		return null;
	}

	if ( text.startsWith( 'Failed to load resource:' ) ) {
		// The resource loading failure is already covered by the "request" or "response" error handlers, so it should
		// not be also reported as the "console error".
		return null;
	}

	return {
		pageUrl,
		type: ERROR_TYPES.CONSOLE_ERROR,
		// First line of the message is the most important one, so we will use it as a message.
		message: text.split( '\n' )[ 0 ] || '(empty message)'
	};
}

async function serializeConsoleMessage( message: ConsoleMessage ): Promise<string> {
	const serializedMessage = await Promise.all( message.args().map( arg => {
		const remoteObject = arg.remoteObject();

		if ( remoteObject.type === 'string' ) {
			return Promise.resolve( remoteObject.value );
		}

		if ( remoteObject.type === 'object' && remoteObject.subtype === 'error' ) {
			return Promise.resolve( remoteObject.description );
		}

		return arg.jsonValue();
	} ) );

	return serializedMessage.join( ' ' ).trim();
}

function getHostForLogs( url: string ): string {
	try {
		return new URL( url ).host;
	} catch {
		return url;
	}
}
