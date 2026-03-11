/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test, vi } from 'vitest';
import type { Page } from 'puppeteer';
import { DATA_ATTRIBUTE_NAME } from '../../src/constants.js';
import { getLinksFromPage } from '../../src/crawler/get-links-from-page.js';
import { getAllLinks } from '../../src/page/get-all-links.js';

describe( 'getLinksFromPage()', () => {
	test( 'filters out external, discovered and excluded links', async () => {
		const evaluate = vi.fn().mockResolvedValue( [
			'https://ckeditor.com/docs/start',
			'https://ckeditor.com/docs/new',
			'https://ckeditor.com/docs/ignore-me',
			'https://external.com/article'
		] );

		const page = {
			evaluate
		} as unknown as Page;

		const links = await getLinksFromPage( {
			page,
			baseUrl: 'https://ckeditor.com/docs/',
			discoveredLinks: new Set( [ 'https://ckeditor.com/docs/start' ] ),
			exclusions: [ 'ignore-me' ]
		} );

		expect( evaluate ).toHaveBeenCalledWith( getAllLinks, DATA_ATTRIBUTE_NAME );
		expect( links ).toEqual( [ 'https://ckeditor.com/docs/new' ] );
	} );

	test( 'returns an empty array if all links are filtered out', async () => {
		const page = {
			evaluate: vi.fn().mockResolvedValue( [
				'https://ckeditor.com/docs/start',
				'https://external.com/article'
			] )
		} as unknown as Page;

		const links = await getLinksFromPage( {
			page,
			baseUrl: 'https://ckeditor.com/docs/',
			discoveredLinks: new Set( [ 'https://ckeditor.com/docs/start' ] ),
			exclusions: []
		} );

		expect( links ).toEqual( [] );
	} );
} );
