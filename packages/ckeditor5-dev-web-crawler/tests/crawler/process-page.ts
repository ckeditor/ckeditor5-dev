/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Page } from 'puppeteer';
import type { Cluster } from 'puppeteer-cluster';
import { processPage } from '../../src/crawler/process-page.js';
import { ERROR_TYPES } from '../../src/constants.js';
import type { CrawlerError, QueueData, RetryableCrawlerError } from '../../src/types.js';

const {
	attachPageEventHandlersMock,
	getErrorIgnorePatternsFromPageMock,
	markErrorsAsIgnoredMock,
	getLinksFromPageMock
} = vi.hoisted( () => {
	return {
		attachPageEventHandlersMock: vi.fn(),
		getErrorIgnorePatternsFromPageMock: vi.fn(),
		markErrorsAsIgnoredMock: vi.fn(),
		getLinksFromPageMock: vi.fn()
	};
} );

vi.mock( '../../src/page/page-events.js', () => {
	return {
		attachPageEventHandlers: attachPageEventHandlersMock
	};
} );

vi.mock( '../../src/errors/ignore-patterns.js', () => {
	return {
		getErrorIgnorePatternsFromPage: getErrorIgnorePatternsFromPageMock,
		markErrorsAsIgnored: markErrorsAsIgnoredMock
	};
} );

vi.mock( '../../src/crawler/get-links-from-page.js', () => {
	return {
		getLinksFromPage: getLinksFromPageMock
	};
} );

function createPageMock( gotoImpl?: () => Promise<void> ): Page {
	return {
		setRequestInterception: vi.fn().mockResolvedValue( undefined ),
		goto: vi.fn().mockImplementation( gotoImpl || ( () => Promise.resolve() ) )
	} as unknown as Page;
}

function createClusterMock(): Cluster<QueueData, void> {
	return {
		queue: vi.fn()
	} as unknown as Cluster<QueueData, void>;
}

function createQueueData( overrides: Partial<QueueData> = {} ): QueueData {
	return {
		url: 'https://ckeditor.com/docs/start',
		parentUrl: '(none)',
		remainingNestedLevels: 1,
		...overrides
	};
}

async function expectRetryableError( callback: () => Promise<void> ): Promise<RetryableCrawlerError> {
	try {
		await callback();
		throw new Error( 'Expected processPage() to throw.' );
	} catch ( error ) {
		return error as RetryableCrawlerError;
	}
}

describe( 'processPage()', () => {
	beforeEach( () => {
		vi.clearAllMocks();

		attachPageEventHandlersMock.mockReturnValue( vi.fn() );
		getErrorIgnorePatternsFromPageMock.mockResolvedValue( new Map() );
		markErrorsAsIgnoredMock.mockImplementation( () => {} );
		getLinksFromPageMock.mockResolvedValue( [] );
	} );

	test( 'queues newly discovered links when depth is greater than 0', async () => {
		const page = createPageMock();
		const cluster = createClusterMock();
		const discoveredLinks = new Set( [ 'https://ckeditor.com/docs/start' ] );

		getLinksFromPageMock.mockResolvedValue( [
			'https://ckeditor.com/docs/next',
			'https://ckeditor.com/docs/more'
		] );

		await processPage( {
			page,
			data: createQueueData( { remainingNestedLevels: 2 } ),
			cluster,
			baseUrl: 'https://ckeditor.com/docs/',
			discoveredLinks,
			exclusions: [ '/api/' ]
		} );

		expect( page.setRequestInterception ).toHaveBeenCalledWith( true );
		expect( page.goto ).toHaveBeenCalledWith( 'https://ckeditor.com/docs/start', { waitUntil: 'networkidle0' } );
		expect( getLinksFromPageMock ).toHaveBeenCalledWith( expect.objectContaining( {
			page,
			baseUrl: 'https://ckeditor.com/docs/',
			exclusions: [ '/api/' ]
		} ) );
		expect( cluster.queue ).toHaveBeenCalledTimes( 2 );
		expect( cluster.queue ).toHaveBeenCalledWith( {
			url: 'https://ckeditor.com/docs/next',
			parentUrl: 'https://ckeditor.com/docs/start',
			remainingNestedLevels: 1
		} );
		expect( cluster.queue ).toHaveBeenCalledWith( {
			url: 'https://ckeditor.com/docs/more',
			parentUrl: 'https://ckeditor.com/docs/start',
			remainingNestedLevels: 1
		} );
		expect( discoveredLinks ).toEqual( new Set( [
			'https://ckeditor.com/docs/start',
			'https://ckeditor.com/docs/next',
			'https://ckeditor.com/docs/more'
		] ) );
		expect( getErrorIgnorePatternsFromPageMock ).not.toHaveBeenCalled();
	} );

	test( 'does not collect links when depth limit is reached', async () => {
		const page = createPageMock();
		const cluster = createClusterMock();

		await processPage( {
			page,
			data: createQueueData( { remainingNestedLevels: 0 } ),
			cluster,
			baseUrl: 'https://ckeditor.com/docs/',
			discoveredLinks: new Set(),
			exclusions: []
		} );

		expect( getLinksFromPageMock ).not.toHaveBeenCalled();
		expect( cluster.queue ).not.toHaveBeenCalled();
	} );

	test( 'uses shorter wait strategy for API pages', async () => {
		const page = createPageMock();

		await processPage( {
			page,
			data: createQueueData( { url: 'https://ckeditor.com/docs/api/module' } ),
			cluster: createClusterMock(),
			baseUrl: 'https://ckeditor.com/docs/',
			discoveredLinks: new Set(),
			exclusions: []
		} );

		expect( page.goto ).toHaveBeenCalledWith( 'https://ckeditor.com/docs/api/module', { waitUntil: 'load' } );
	} );

	test( 'throws retryable error when page errors remain after filtering', async () => {
		const detach = vi.fn();
		const page = createPageMock();

		attachPageEventHandlersMock.mockImplementation( ( { data, pageErrors }: {
			data: QueueData;
			pageErrors: Array<CrawlerError>;
		} ) => {
			pageErrors.push( {
				pageUrl: data.url,
				type: ERROR_TYPES.CONSOLE_ERROR,
				message: 'Something went wrong'
			} );

			return detach;
		} );

		const thrownError = await expectRetryableError( () => processPage( {
			page,
			data: createQueueData(),
			cluster: createClusterMock(),
			baseUrl: 'https://ckeditor.com/docs/',
			discoveredLinks: new Set(),
			exclusions: []
		} ) );

		expect( thrownError.message ).toContain( 'found 1 page error' );
		expect( thrownError.crawlerErrors ).toEqual( [
			expect.objectContaining( {
				type: ERROR_TYPES.CONSOLE_ERROR,
				message: 'Something went wrong'
			} )
		] );
		expect( getErrorIgnorePatternsFromPageMock ).toHaveBeenCalledWith( page );
		expect( markErrorsAsIgnoredMock ).toHaveBeenCalled();
		expect( detach ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'does not add navigation error when matching request failure already exists', async () => {
		const page = createPageMock( () => Promise.reject( new Error( 'Navigation failed' ) ) );

		attachPageEventHandlersMock.mockImplementation( ( { data, pageErrors }: {
			data: QueueData;
			pageErrors: Array<CrawlerError>;
		} ) => {
			pageErrors.push( {
				pageUrl: data.parentUrl,
				type: ERROR_TYPES.REQUEST_FAILURE,
				message: 'Request failed',
				failedResourceUrl: data.url
			} );

			return vi.fn();
		} );

		const thrownError = await expectRetryableError( () => processPage( {
			page,
			data: createQueueData( { parentUrl: 'https://ckeditor.com/docs' } ),
			cluster: createClusterMock(),
			baseUrl: 'https://ckeditor.com/docs/',
			discoveredLinks: new Set(),
			exclusions: []
		} ) );

		expect( thrownError.crawlerErrors ).toHaveLength( 1 );
		expect( thrownError.crawlerErrors[ 0 ]!.type ).toBe( ERROR_TYPES.REQUEST_FAILURE );
	} );

	test( 'resolves when all discovered errors are marked as ignored', async () => {
		attachPageEventHandlersMock.mockImplementation( ( { data, pageErrors }: {
			data: QueueData;
			pageErrors: Array<CrawlerError>;
		} ) => {
			pageErrors.push( {
				pageUrl: data.url,
				type: ERROR_TYPES.CONSOLE_ERROR,
				message: 'Noise'
			} );

			return vi.fn();
		} );

		markErrorsAsIgnoredMock.mockImplementation( ( errors: Array<CrawlerError> ) => {
			errors.forEach( error => {
				error.ignored = true;
			} );
		} );

		await expect( processPage( {
			page: createPageMock(),
			data: createQueueData(),
			cluster: createClusterMock(),
			baseUrl: 'https://ckeditor.com/docs/',
			discoveredLinks: new Set(),
			exclusions: []
		} ) ).resolves.toBeUndefined();
	} );
} );
