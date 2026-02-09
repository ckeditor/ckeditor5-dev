/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ErrorType } from '../constants.js';
import type { CrawlerError, ErrorCollection } from '../types.js';

export type ErrorStore = Map<ErrorType, Map<string, ErrorCollection>>;

/**
 * Returns an error handler, which is called every time new error is found.
 */
export function getErrorHandler( errors: ErrorStore ): ( error: CrawlerError ) => void {
	return error => addCrawlerError( errors, error );
}

function addCrawlerError( errors: ErrorStore, error: CrawlerError ): void {
	if ( !errors.has( error.type ) ) {
		errors.set( error.type, new Map() );
	}

	// Split the message into the first line and all the rest. The first line is the key by which the errors are grouped together.
	// All errors are grouped together only by the first message line (without the error call stack and other details, that could
	// possibly exist after the first line), because there is a good chance that the same error can be triggered in different
	// contexts (so in different call stacks). In order not to duplicate almost the same errors, we need to determine their common
	// part.
	const messageLines = error.message.split( '\n' );
	const firstMessageLine = messageLines.shift()!;
	const nextMessageLines = messageLines.join( '\n' );
	const errorCollection = errors.get( error.type )!;

	if ( !errorCollection.has( firstMessageLine ) ) {
		errorCollection.set( firstMessageLine, {
			// Store only unique pages, because given error can occur multiple times on the same page.
			pages: new Set(),
			details: nextMessageLines
		} );
	}

	errorCollection.get( firstMessageLine )!.pages.add( error.pageUrl );
}
