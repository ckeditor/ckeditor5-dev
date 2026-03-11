/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test } from 'vitest';
import { getAllLinks } from '../../src/page/get-all-links.js';

interface LinkMock {
	href: string;
	protocol: string;
	origin: string;
	pathname: string;
	hasAttribute: ( attributeName: string ) => boolean;
}

function createLink( {
	href,
	protocol,
	origin,
	pathname,
	attributes = []
}: {
	href: string;
	protocol: string;
	origin: string;
	pathname: string;
	attributes?: Array<string>;
} ): LinkMock {
	const attributeSet = new Set( attributes );

	return {
		href,
		protocol,
		origin,
		pathname,
		hasAttribute: attributeName => attributeSet.has( attributeName )
	};
}

describe( 'getAllLinks()', () => {
	test( 'returns unique absolute HTTP links and filters unsupported anchors', () => {
		Object.defineProperty( globalThis, 'document', {
			value: {
				links: [
					createLink( {
						href: 'https://ckeditor.com/docs/start?x=1',
						protocol: 'https:',
						origin: 'https://ckeditor.com',
						pathname: '/docs/start'
					} ),
					createLink( {
						href: 'https://ckeditor.com/docs/start#hash',
						protocol: 'https:',
						origin: 'https://ckeditor.com',
						pathname: '/docs/start'
					} ),
					createLink( {
						href: 'https://ckeditor.com/docs/internal',
						protocol: 'https:',
						origin: 'https://ckeditor.com',
						pathname: '/docs/internal',
						attributes: [ 'data-cke-crawler-skip' ]
					} ),
					createLink( {
						href: 'https://ckeditor.com/docs/file.zip',
						protocol: 'https:',
						origin: 'https://ckeditor.com',
						pathname: '/docs/file.zip',
						attributes: [ 'download' ]
					} ),
					createLink( {
						href: 'mailto:test@ckeditor.com',
						protocol: 'mailto:',
						origin: '',
						pathname: ''
					} ),
					createLink( {
						href: '',
						protocol: 'https:',
						origin: 'https://ckeditor.com',
						pathname: '/docs/empty'
					} )
				]
			}
		} );

		expect( getAllLinks( 'data-cke-crawler-skip' ) ).toEqual( [
			'https://ckeditor.com/docs/start'
		] );
	} );
} );
