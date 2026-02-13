/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test, vi } from 'vitest';
import type { Page } from 'puppeteer';
import { ERROR_TYPES, IGNORE_ALL_ERRORS_WILDCARD, type ErrorType } from '../../src/constants.js';
import { getErrorIgnorePatternsFromPage, markErrorsAsIgnored } from '../../src/errors/ignore-patterns.js';
import type { CrawlerError } from '../../src/types.js';

function createPageMock( content: string | null, hasMetaTag = true ): Page {
	return {
		$: vi.fn().mockResolvedValue( hasMetaTag ? {
			evaluate: vi.fn().mockImplementation( callback => {
				return callback( {
					getAttribute: () => content
				} );
			} )
		} : null )
	} as unknown as Page;
}

describe( 'getErrorIgnorePatternsFromPage()', () => {
	test( 'returns empty map when meta tag is missing', async () => {
		const page = createPageMock( null, false );

		expect( await getErrorIgnorePatternsFromPage( page ) ).toEqual( new Map() );
	} );

	test( 'returns empty map when content is invalid JSON', async () => {
		const page = createPageMock( 'not-json' );

		expect( await getErrorIgnorePatternsFromPage( page ) ).toEqual( new Map() );
	} );

	test( 'maps valid patterns and ignores invalid entries', async () => {
		const page = createPageMock( JSON.stringify( {
			'request-failure': [ 'cdn', '', 123, 'missing.css' ],
			'navigation-error': IGNORE_ALL_ERRORS_WILDCARD,
			'console-error': [ '' ],
			'unknown-type': [ 'nope' ]
		} ) );

		const patterns = await getErrorIgnorePatternsFromPage( page );

		expect( patterns.get( ERROR_TYPES.REQUEST_FAILURE ) ).toEqual( new Set( [ 'cdn', 'missing.css' ] ) );
		expect( patterns.get( ERROR_TYPES.NAVIGATION_ERROR ) ).toEqual( new Set( [ IGNORE_ALL_ERRORS_WILDCARD ] ) );
		expect( patterns.has( ERROR_TYPES.CONSOLE_ERROR ) ).toBe( false );
	} );
} );

describe( 'markErrorsAsIgnored()', () => {
	test( 'marks errors using wildcard, message pattern and failed resource URL', () => {
		const errors: Array<CrawlerError> = [
			{
				pageUrl: 'https://ckeditor.com/docs/guide',
				type: ERROR_TYPES.REQUEST_FAILURE,
				message: 'Failed to load CDN resource'
			},
			{
				pageUrl: 'https://ckeditor.com/docs/guide',
				type: ERROR_TYPES.CONSOLE_ERROR,
				message: 'Some console error'
			},
			{
				pageUrl: 'https://ckeditor.com/docs/guide',
				type: ERROR_TYPES.RESPONSE_FAILURE,
				message: 'HTTP 404',
				failedResourceUrl: 'https://ckeditor.com/assets/missing.js'
			},
			{
				pageUrl: 'https://ckeditor.com/docs/guide',
				type: ERROR_TYPES.UNCAUGHT_EXCEPTION,
				message: 'Should stay visible'
			}
		];

		const patterns: Map<ErrorType, Set<string>> = new Map();

		patterns.set( ERROR_TYPES.REQUEST_FAILURE, new Set( [ 'CDN resource' ] ) );
		patterns.set( ERROR_TYPES.CONSOLE_ERROR, new Set( [ IGNORE_ALL_ERRORS_WILDCARD ] ) );
		patterns.set( ERROR_TYPES.RESPONSE_FAILURE, new Set( [ 'missing.js' ] ) );

		markErrorsAsIgnored( errors, patterns );

		expect( errors[ 0 ]!.ignored ).toBe( true );
		expect( errors[ 1 ]!.ignored ).toBe( true );
		expect( errors[ 2 ]!.ignored ).toBe( true );
		expect( errors[ 3 ]!.ignored ).toBeUndefined();
	} );
} );
