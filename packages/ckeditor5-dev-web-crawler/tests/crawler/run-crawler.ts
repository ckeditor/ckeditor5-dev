/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Cluster } from 'puppeteer-cluster';
import { runCrawler } from '../../src/crawler/run-crawler.js';
import { createCrawlerCluster } from '../../src/crawler/create-cluster.js';
import { processPage } from '../../src/crawler/process-page.js';
import { logErrors } from '../../src/errors/reporter.js';
import { DEFAULT_CONCURRENCY, DEFAULT_TIMEOUT, ERROR_TYPES } from '../../src/constants.js';
import type { QueueData } from '../../src/types.js';

vi.mock( '../../src/crawler/create-cluster.js' );
vi.mock( '../../src/crawler/process-page.js' );
vi.mock( '../../src/errors/reporter.js' );

interface MockCluster {
	task: ReturnType<typeof vi.fn>;
	queue: ReturnType<typeof vi.fn>;
	idle: ReturnType<typeof vi.fn>;
	close: ReturnType<typeof vi.fn>;
}

function createClusterMock(): MockCluster {
	return {
		task: vi.fn().mockImplementation( async taskCallback => {
			await taskCallback( {
				page: { id: 'page' },
				data: {
					url: 'https://ckeditor.com/docs/start',
					parentUrl: '(none)',
					remainingNestedLevels: 1
				}
			} );
		} ),
		queue: vi.fn(),
		idle: vi.fn().mockResolvedValue( undefined ),
		close: vi.fn().mockResolvedValue( undefined )
	};
}

describe( 'runCrawler()', () => {
	beforeEach( () => {
		vi.clearAllMocks();

		vi.spyOn( process, 'exit' ).mockImplementation( () => undefined as never );
		vi.spyOn( console, 'log' ).mockImplementation( () => {} );
	} );

	test( 'uses default options and exits with code 0 when no errors are collected', async () => {
		const cluster = createClusterMock();

		vi.mocked( createCrawlerCluster ).mockResolvedValue( cluster as unknown as Cluster<QueueData, void> );

		await runCrawler( {
			url: 'https://ckeditor.com/docs/start'
		} );

		expect( vi.mocked( createCrawlerCluster ) ).toHaveBeenCalledWith( expect.objectContaining( {
			timeout: DEFAULT_TIMEOUT,
			concurrency: DEFAULT_CONCURRENCY,
			disableBrowserSandbox: false,
			ignoreHTTPSErrors: false,
			silent: false,
			onError: expect.any( Function )
		} ) );

		expect( vi.mocked( processPage ) ).toHaveBeenCalledWith( expect.objectContaining( {
			baseUrl: 'https://ckeditor.com/docs/start',
			exclusions: []
		} ) );

		expect( cluster.queue ).toHaveBeenCalledWith( {
			url: 'https://ckeditor.com/docs/start',
			parentUrl: '(none)',
			remainingNestedLevels: Infinity
		} );
		expect( cluster.idle ).toHaveBeenCalledTimes( 1 );
		expect( cluster.close ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( logErrors ) ).toHaveBeenCalledTimes( 1 );
		expect( process.exit ).toHaveBeenCalledWith( 0 );
	} );

	test( 'passes provided options and exits with code 1 when errors were collected', async () => {
		const cluster = createClusterMock();

		vi.mocked( createCrawlerCluster ).mockImplementation( async options => {
			options.onError( {
				pageUrl: 'https://ckeditor.com/docs/start',
				type: ERROR_TYPES.PAGE_CRASH,
				message: 'Crash'
			} );

			return cluster as unknown as Cluster<QueueData, void>;
		} );

		await runCrawler( {
			url: 'https://ckeditor.com/docs/start',
			depth: 2,
			exclusions: [ '/api/' ],
			timeout: 5000,
			concurrency: 3,
			disableBrowserSandbox: true,
			ignoreHTTPSErrors: true,
			silent: true
		} );

		expect( vi.mocked( createCrawlerCluster ) ).toHaveBeenCalledWith( expect.objectContaining( {
			timeout: 5000,
			concurrency: 3,
			disableBrowserSandbox: true,
			ignoreHTTPSErrors: true,
			silent: true,
			onError: expect.any( Function )
		} ) );

		expect( cluster.queue ).toHaveBeenCalledWith( {
			url: 'https://ckeditor.com/docs/start',
			parentUrl: '(none)',
			remainingNestedLevels: 2
		} );
		expect( process.exit ).toHaveBeenCalledWith( 1 );
	} );
} );
