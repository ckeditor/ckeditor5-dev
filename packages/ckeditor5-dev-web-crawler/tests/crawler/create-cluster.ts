/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createCrawlerCluster } from '../../src/crawler/create-cluster.js';
import { DEFAULT_RETRIES, DEFAULT_RETRY_DELAY, ERROR_TYPES } from '../../src/constants.js';

const { launchMock } = vi.hoisted( () => {
	return {
		launchMock: vi.fn()
	};
} );

vi.mock( 'puppeteer-cluster', () => {
	return {
		Cluster: {
			CONCURRENCY_PAGE: 'CONCURRENCY_PAGE',
			launch: launchMock
		}
	};
} );

interface MockCluster {
	on: ReturnType<typeof vi.fn>;
	emitTaskError: ( error: any, data: any, willRetry?: boolean ) => void;
}

function createClusterMock(): MockCluster {
	let taskErrorHandler: ( error: any, data: any, willRetry?: boolean ) => void = () => {
		throw new Error( 'taskerror handler is not registered' );
	};

	return {
		on: vi.fn().mockImplementation( ( eventName, callback ) => {
			if ( eventName === 'taskerror' ) {
				taskErrorHandler = callback;
			}
		} ),
		emitTaskError: ( error, data, willRetry ) => taskErrorHandler( error, data, willRetry )
	};
}

describe( 'createCrawlerCluster()', () => {
	beforeEach( () => {
		launchMock.mockReset();
	} );

	test( 'launches cluster with configured options', async () => {
		const cluster = createClusterMock();
		const onError = vi.fn();

		launchMock.mockResolvedValue( cluster );

		await createCrawlerCluster( {
			timeout: 2000,
			concurrency: 4,
			disableBrowserSandbox: true,
			ignoreHTTPSErrors: true,
			silent: true,
			onError
		} );

		expect( launchMock ).toHaveBeenCalledWith( expect.objectContaining( {
			concurrency: 'CONCURRENCY_PAGE',
			timeout: 2000,
			retryLimit: DEFAULT_RETRIES,
			retryDelay: DEFAULT_RETRY_DELAY,
			maxConcurrency: 4,
			skipDuplicateUrls: false,
			monitor: false
		} ) );

		const options = launchMock.mock.calls[ 0 ]![ 0 ];

		expect( options.puppeteerOptions.headless ).toBe( true );
		expect( options.puppeteerOptions.acceptInsecureCerts ).toBe( true );
		expect( options.puppeteerOptions.args ).toContain( '--no-sandbox' );
		expect( options.puppeteerOptions.args ).toContain( '--disable-setuid-sandbox' );
	} );

	test( 'logs retry information and skips error reporting while retrying', async () => {
		const cluster = createClusterMock();
		const onError = vi.fn();
		const consoleLogSpy = vi.spyOn( console, 'log' ).mockImplementation( () => {} );

		launchMock.mockResolvedValue( cluster );

		await createCrawlerCluster( {
			timeout: 2000,
			concurrency: 2,
			disableBrowserSandbox: false,
			ignoreHTTPSErrors: false,
			silent: false,
			onError
		} );

		cluster.emitTaskError( new Error( 'Temporary issue' ), { url: 'https://ckeditor.com/docs' }, true );

		expect( consoleLogSpy ).toHaveBeenCalledWith( 'Retrying /docs...' );
		expect( onError ).not.toHaveBeenCalled();
	} );

	test( 'forwards crawler errors from a retryable error object', async () => {
		const cluster = createClusterMock();
		const onError = vi.fn();

		launchMock.mockResolvedValue( cluster );

		await createCrawlerCluster( {
			timeout: 2000,
			concurrency: 2,
			disableBrowserSandbox: false,
			ignoreHTTPSErrors: false,
			silent: false,
			onError
		} );

		const crawlerErrors = [
			{ pageUrl: 'https://ckeditor.com/docs', type: ERROR_TYPES.REQUEST_FAILURE, message: 'A' },
			{ pageUrl: 'https://ckeditor.com/docs', type: ERROR_TYPES.CONSOLE_ERROR, message: 'B' }
		];

		cluster.emitTaskError( { crawlerErrors }, { url: 'https://ckeditor.com/docs' }, false );

		expect( onError ).toHaveBeenCalledTimes( 2 );
		expect( onError ).toHaveBeenCalledWith( crawlerErrors[ 0 ]! );
		expect( onError ).toHaveBeenCalledWith( crawlerErrors[ 1 ]! );
	} );

	test( 'reports page crash for generic task errors', async () => {
		const cluster = createClusterMock();
		const onError = vi.fn();

		launchMock.mockResolvedValue( cluster );

		await createCrawlerCluster( {
			timeout: 2000,
			concurrency: 2,
			disableBrowserSandbox: false,
			ignoreHTTPSErrors: false,
			silent: false,
			onError
		} );

		cluster.emitTaskError( new Error( 'boom' ), { url: 'https://ckeditor.com/docs/start' }, false );

		expect( onError ).toHaveBeenCalledWith( expect.objectContaining( {
			pageUrl: 'https://ckeditor.com/docs/start',
			type: ERROR_TYPES.PAGE_CRASH,
			message: expect.stringContaining( 'Error crawling /docs/start: boom' )
		} ) );
	} );
} );
