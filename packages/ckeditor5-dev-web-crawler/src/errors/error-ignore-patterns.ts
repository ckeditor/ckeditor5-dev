/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { stripVTControlCharacters } from 'node:util';
import type { Page } from 'puppeteer';
import {
	IGNORE_ALL_ERRORS_WILDCARD,
	META_TAG_NAME,
	PATTERN_TYPE_TO_ERROR_TYPE_MAP,
	type ErrorType
} from '../constants.js';
import { toArray } from '../utils.js';
import type { CrawlerError } from '../types.js';

/**
 * Finds all meta tags that contain patterns to ignore errors and returns a map between error type and these patterns.
 */
export async function getErrorIgnorePatternsFromPage( page: Page ): Promise<Map<ErrorType, Set<string>>> {
	const patterns = new Map<ErrorType, Set<string>>();
	const metaTag = await page.$( `head > meta[name=${ META_TAG_NAME }]` );

	// If meta tag is not defined, return an empty map.
	if ( !metaTag ) {
		return patterns;
	}

	const contentString = await metaTag.evaluate( metaTag => metaTag.getAttribute( 'content' ) );

	if ( !contentString ) {
		return patterns;
	}

	let content: unknown;

	try {
		// Try to parse value from meta tag...
		content = JSON.parse( contentString );
	} catch {
		// ...but if it is not a valid JSON, return an empty map.
		return patterns;
	}

	if ( !content || typeof content !== 'object' ) {
		return patterns;
	}

	for ( const [ type, pattern ] of Object.entries( content as Record<string, unknown> ) ) {
		const errorType = PATTERN_TYPE_TO_ERROR_TYPE_MAP[ type as keyof typeof PATTERN_TYPE_TO_ERROR_TYPE_MAP ];

		if ( !errorType ) {
			continue;
		}

		const patternCollection = new Set( toArray( pattern )
			// Only string patterns are supported, as the error message produced by the crawler is always a string.
			.filter( ( pattern ): pattern is string => typeof pattern === 'string' )
			// Only non-empty patterns are supported, because an empty pattern would cause all errors in a given type to be ignored.
			.filter( pattern => pattern.length > 0 )
		);

		if ( !patternCollection.size ) {
			continue;
		}

		patterns.set( errorType, patternCollection );
	}

	return patterns;
}

/**
 * Iterates over all found errors from given link and marks errors as ignored if their message matches the ignore pattern.
 */
export function markErrorsAsIgnored( errors: Array<CrawlerError>, errorIgnorePatterns: Map<ErrorType, Set<string>> ): void {
	errors.forEach( error => {
		const patterns = errorIgnorePatterns.get( error.type );

		// Skip, if there is no pattern defined for currently examined error type.
		if ( !patterns ) {
			return;
		}

		const message = stripVTControlCharacters( error.message );

		// If at least one pattern matches the error message, mark currently examined error as ignored.
		const isIgnored = Array
			.from( patterns )
			.some( pattern =>
				pattern === IGNORE_ALL_ERRORS_WILDCARD ||
				message.includes( pattern ) ||
				error.failedResourceUrl?.includes( pattern )
			);

		if ( isIgnored ) {
			error.ignored = true;
		}
	} );
}
