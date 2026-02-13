/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test } from 'vitest';
import type { HTTPRequest } from 'puppeteer';
import { shouldAbortRequest } from '../../src/page/request-policy.js';

type ResourceType = ReturnType<HTTPRequest['resourceType']>;

function createRequest( url: string, resourceType: ResourceType = 'document' ): any {
	return {
		url: () => url,
		resourceType: () => resourceType
	};
}

describe( 'shouldAbortRequest()', () => {
	test( 'returns true for media requests', () => {
		const request = createRequest( 'https://ckeditor.com/video.mp4', 'media' );

		expect( shouldAbortRequest( request ) ).toBe( true );
	} );

	test( 'returns true for ignored hosts', () => {
		const request = createRequest( 'https://player.vimeo.com/video/123' );

		expect( shouldAbortRequest( request ) ).toBe( true );
	} );

	test( 'returns true for api.json files', () => {
		const request = createRequest( 'https://ckeditor.com/docs/api.json' );

		expect( shouldAbortRequest( request ) ).toBe( true );
	} );

	test( 'does not block requests without hostnames', () => {
		const request = createRequest( 'data:text/plain,hello', 'media' );

		expect( shouldAbortRequest( request ) ).toBe( false );
	} );

	test( 'returns false for regular requests', () => {
		const request = createRequest( 'https://ckeditor.com/docs/guide' );

		expect( shouldAbortRequest( request ) ).toBe( false );
	} );
} );
