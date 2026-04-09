/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted( () => ( {
	generateTemplate: vi.fn().mockResolvedValue( undefined )
} ) );

describe( 'generate-template CLI', () => {
	beforeEach( () => {
		vi.resetModules();
		mocks.generateTemplate.mockClear();
	} );

	it( 'runs template generation', async () => {
		vi.doMock( '@ckeditor/ckeditor5-dev-changelog/dist/template.js', () => ( {
			generateTemplate: mocks.generateTemplate
		} ) );

		// @ts-expect-error The bin wrapper is plain JavaScript and does not expose TypeScript declarations.
		await import( '../bin/generate-template.js' );

		expect( mocks.generateTemplate ).toHaveBeenCalledOnce();
		expect( mocks.generateTemplate ).toHaveBeenCalledWith();
	} );
} );
