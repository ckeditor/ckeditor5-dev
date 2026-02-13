/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test } from 'vitest';
import { ERROR_TYPES } from '../../src/constants.js';
import { createErrorCollector, createErrorStore } from '../../src/errors/error-store.js';

describe( 'createErrorStore()', () => {
	test( 'returns an empty map', () => {
		expect( createErrorStore() ).toEqual( new Map() );
	} );
} );

describe( 'createErrorCollector()', () => {
	test( 'groups errors by type and first message line', () => {
		const store = createErrorStore();
		const collect = createErrorCollector( store );

		collect( {
			pageUrl: 'https://ckeditor.com/docs/guide',
			type: ERROR_TYPES.CONSOLE_ERROR,
			message: 'Console failure\nStack trace #1'
		} );

		collect( {
			pageUrl: 'https://ckeditor.com/docs/api',
			type: ERROR_TYPES.CONSOLE_ERROR,
			message: 'Console failure\nStack trace #2'
		} );

		const errorCollection = store.get( ERROR_TYPES.CONSOLE_ERROR )!;
		const groupedError = errorCollection.get( 'Console failure' )!;

		expect( errorCollection.size ).toBe( 1 );
		expect( groupedError.pages ).toEqual( new Set( [
			'https://ckeditor.com/docs/guide',
			'https://ckeditor.com/docs/api'
		] ) );
		expect( groupedError.details ).toBe( 'Stack trace #1' );
	} );

	test( 'stores each page only once', () => {
		const store = createErrorStore();
		const collect = createErrorCollector( store );

		collect( {
			pageUrl: 'https://ckeditor.com/docs/guide',
			type: ERROR_TYPES.REQUEST_FAILURE,
			message: 'Could not load script'
		} );

		collect( {
			pageUrl: 'https://ckeditor.com/docs/guide',
			type: ERROR_TYPES.REQUEST_FAILURE,
			message: 'Could not load script'
		} );

		const groupedError = store.get( ERROR_TYPES.REQUEST_FAILURE )!.get( 'Could not load script' )!;

		expect( groupedError.pages ).toEqual( new Set( [ 'https://ckeditor.com/docs/guide' ] ) );
	} );

	test( 'creates separate groups for different types and messages', () => {
		const store = createErrorStore();
		const collect = createErrorCollector( store );

		collect( {
			pageUrl: 'https://ckeditor.com/docs/guide',
			type: ERROR_TYPES.CONSOLE_ERROR,
			message: 'Message A'
		} );

		collect( {
			pageUrl: 'https://ckeditor.com/docs/guide',
			type: ERROR_TYPES.REQUEST_FAILURE,
			message: 'Message A'
		} );

		collect( {
			pageUrl: 'https://ckeditor.com/docs/guide',
			type: ERROR_TYPES.CONSOLE_ERROR,
			message: 'Message B'
		} );

		expect( store.get( ERROR_TYPES.CONSOLE_ERROR )!.size ).toBe( 2 );
		expect( store.get( ERROR_TYPES.REQUEST_FAILURE )!.size ).toBe( 1 );
	} );
} );
