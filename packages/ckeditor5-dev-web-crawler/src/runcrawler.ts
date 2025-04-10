#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

import util from 'util';
import chalk from 'chalk';
import { Cluster } from 'puppeteer-cluster';
import { getBaseUrl, toArray } from './utils.js';
import type { LaunchOptions, Page } from 'puppeteer';

import {
	DEFAULT_CONCURRENCY,
	DEFAULT_TIMEOUT,
	DEFAULT_REMAINING_ATTEMPTS,
	ERROR_TYPES,
	PATTERN_TYPE_TO_ERROR_TYPE_MAP,
	IGNORE_ALL_ERRORS_WILDCARD,
	META_TAG_NAME,
	DATA_ATTRIBUTE_NAME,
	type ErrorType
} from './constants.js';

interface CrawlerOptions {

	/**
	 * The URL to start crawling. This argument is required.
	 */
	url: string;

	/**
	 * Defines how many nested page levels should be examined. Infinity by default.
	 *
	 * @default Infinity
	 */
	depth?: number;

	/**
	 * An array of patterns to exclude links. Empty array by default to not exclude anything.
	 *
	 * @default []
	 */
	exclusions?: Array<string>;

	/**
	 * Number of concurrent pages (browser tabs) to be used during crawling. One by default.
	 *
	 * @default Half of the number of CPU cores.
	 */
	concurrency?: number;

	/**
	 * Whether the browser should be created with the `--no-sandbox` flag.
	 *
	 * @default false
	 */
	disableBrowserSandbox?: boolean;

	/**
	 * Whether the browser should ignore invalid (self-signed) certificates.
	 *
	 * @default false
	 */
	ignoreHTTPSErrors?: boolean;

	/**
	 * Whether to display the current progress or only the result.
	 *
	 * @default false
	 */
	noSpinner?: boolean;
}

interface CrawlerError {
	pageUrl: string;
	type: ( typeof ERROR_TYPES )[ keyof typeof ERROR_TYPES ];
	message: string;
	failedResourceUrl?: string;
	ignored?: boolean;
}

interface QueueData {
	url: string;
	parentUrl: string;
	remainingNestedLevels: number;
}

interface ErrorCollection {
	pages: Set<string>;
	details?: string;
}

/**
 * Crawls the provided URL and all links found on the page. It uses Puppeteer to open the links in a headless browser and checks for errors.
 */
export default async function runCrawler( options: CrawlerOptions ): Promise<void> {
	const {
		url,
		depth = Infinity,
		exclusions = [],
		concurrency = DEFAULT_CONCURRENCY,
		disableBrowserSandbox = false,
		ignoreHTTPSErrors = false,
		noSpinner = false
	} = options;

	console.log( chalk.bold( '\n🔎 Starting the Crawler…\n' ) );

	process.on( 'unhandledRejection', reason => {
		const error = util.inspect( reason, {
			breakLength: Infinity,
			compact: true
		} );

		console.log( chalk.red.bold( `\n🔥 Caught the \`unhandledRejection\` error: ${ error }\n` ) );

		process.exit( 1 );
	} );

	const puppeteerOptions = {
		args: [] as Array<string>,
		headless: true,
		acceptInsecureCerts: ignoreHTTPSErrors
	} satisfies LaunchOptions;

	if ( disableBrowserSandbox ) {
		puppeteerOptions.args.push( '--no-sandbox' );
		puppeteerOptions.args.push( '--disable-setuid-sandbox' );
	}

	const foundLinks: Array<string> = [ url ];
	const errors: Map<ErrorType, Map<string, ErrorCollection>> = new Map();
	const baseUrl = getBaseUrl( url );
	const onError = getErrorHandler( errors );

	const cluster: Cluster<QueueData, void> = await Cluster.launch( {
		concurrency: Cluster.CONCURRENCY_PAGE,
		timeout: DEFAULT_TIMEOUT,
		retryLimit: DEFAULT_REMAINING_ATTEMPTS,
		maxConcurrency: concurrency,
		puppeteerOptions,
		skipDuplicateUrls: true,
		monitor: !noSpinner
	} );

	cluster.on( 'taskerror', ( err, data ) => {
		onError( {
			pageUrl: data.url,
			type: ERROR_TYPES.PAGE_CRASH,
			message: err.message ? `Error crawling ${ data.url }: ${ err.message }` : '(empty message)'
		} );
	} );

	await cluster.task( async ( { page, data } ) => {
		await page.setRequestInterception( true );

		const pageErrors: Array<CrawlerError> = [];

		page.on( 'request', request => {
			const resourceType = request.resourceType();

			// Block all 'media' requests, as they are likely to fail anyway due to limitations in Puppeteer.
			if ( resourceType === 'media' ) {
				request.abort( 'blockedbyclient' );
			} else {
				request.continue();
			}
		} );

		page.on( 'dialog', dialog => dialog.dismiss() );

		page.on( ERROR_TYPES.PAGE_CRASH.event, error => pageErrors.push( {
			pageUrl: page.url(),
			type: ERROR_TYPES.PAGE_CRASH,
			message: ( error as Error ).message || '(empty message)'
		} ) );

		page.on( ERROR_TYPES.REQUEST_FAILURE.event, request => {
			const errorText = request.failure()?.errorText;

			if ( request.response()?.ok() && request.method() === 'POST' ) {
				// Ignore a false positive due to a bug in Puppeteer.
				// https://github.com/puppeteer/puppeteer/issues/9458
				return;
			}

			// Do not log errors explicitly aborted by the crawler.
			if ( errorText !== 'net::ERR_BLOCKED_BY_CLIENT.Inspector' ) {
				const url = request.url();
				const host = new URL( url ).host;
				const isNavigation = isNavigationRequest( request );
				const message = isNavigation ?
					`Failed to open link ${ chalk.bold( url ) }` :
					`Failed to load resource from ${ chalk.bold( host ) }`;

				pageErrors.push( {
					pageUrl: isNavigation ? data.parentUrl : page.url(),
					type: ERROR_TYPES.REQUEST_FAILURE,
					message: `${ message } (failure message: ${ chalk.bold( errorText ) })`,
					failedResourceUrl: url
				} );
			}
		} );

		page.on( ERROR_TYPES.RESPONSE_FAILURE.event, response => {
			const responseStatus = response.status();

			if ( responseStatus > 399 ) {
				const url = response.url();
				const host = new URL( url ).host;
				const isNavigation = isNavigationRequest( response.request() );
				const message = isNavigation ?
					`Failed to open link ${ chalk.bold( url ) }` :
					`Failed to load resource from ${ chalk.bold( host ) }`;

				pageErrors.push( {
					pageUrl: isNavigation ? data.parentUrl : page.url(),
					type: ERROR_TYPES.RESPONSE_FAILURE,
					message: `${ message } (HTTP response status code: ${ chalk.bold( responseStatus ) })`,
					failedResourceUrl: url
				} );
			}
		} );

		const session = await page.createCDPSession();

		await session.send( 'Runtime.enable' );

		session.on( 'Runtime.exceptionThrown', event => {
			const message = event.exceptionDetails.exception?.description ||
				event.exceptionDetails.exception?.value ||
				event.exceptionDetails.text ||
				'(No description provided)';

			pageErrors.push( {
				pageUrl: page.url(),
				type: ERROR_TYPES.CONSOLE_ERROR,
				message
			} );
		} );

		try {
			await page.goto( data.url, { waitUntil: [ 'load', 'networkidle0' ] } );
		} catch ( error ) {
			const errorMessage = ( error as Error ).message || '(empty message)';

			// All navigation errors starting with the `net::` prefix are already covered by the "request" error handler, so it should
			// not be also reported as the "navigation error".
			const ignoredMessage = 'net::';

			if ( !errorMessage.startsWith( ignoredMessage ) ) {
				pageErrors.push( {
					pageUrl: data.url,
					type: ERROR_TYPES.NAVIGATION_ERROR,
					message: errorMessage
				} );
			}
		}

		// Create patterns from meta tags to ignore errors.
		const errorIgnorePatterns = await getErrorIgnorePatternsFromPage( page );

		// Iterates over recently found errors to mark them as ignored ones, if they match the patterns.
		markErrorsAsIgnored( pageErrors, errorIgnorePatterns );

		pageErrors
			.filter( error => !error.ignored )
			.forEach( error => onError( error ) );

		if ( data.remainingNestedLevels === 0 ) {
			// Skip crawling deeper, if the bottom has been reached
			return;
		}

		const links = await getLinksFromPage( page, { baseUrl, foundLinks, exclusions } );

		links.forEach( link => {
			foundLinks.push( link );

			cluster.queue( {
				url: link,
				parentUrl: data.parentUrl,
				remainingNestedLevels: data.remainingNestedLevels - 1
			} );
		} );
	} );

	// Queue the first link to be crawled.
	cluster.queue( {
		url,
		parentUrl: '(none)',
		remainingNestedLevels: depth
	} );

	await cluster.idle();
	await cluster.close();

	logErrors( errors );

	process.exit( errors.size ? 1 : 0 );
}

/**
 * Returns an error handler, which is called every time new error is found.
 */
function getErrorHandler( errors: Map<ErrorType, Map<string, ErrorCollection>> ): ( error: CrawlerError ) => void {
	return error => {
		if ( !errors.has( error.type ) ) {
			errors.set( error.type, new Map() );
		}

		// Split the message into the first line and all the rest. The first line is the key by which the errors are grouped together.
		// All errors are grouped together only by the first message line (without the error call stack and other details, that could
		// possibly exist after the first line), because there is a good chance that the same error can be triggered in a different
		// contexts (so in a different call stacks). In order not to duplicate almost the same errors, we need to determine their common
		// part.
		const messageLines = error.message.split( '\n' );
		const firstMessageLine = messageLines.shift()!;
		const nextMessageLines = messageLines.join( '\n' );

		const errorCollection = errors.get( error.type )!;

		if ( !errorCollection.has( firstMessageLine ) ) {
			errorCollection.set( firstMessageLine, {
				// Store only unique pages, because given error can occur multiple times on the same page.
				pages: new Set(),
				details: nextMessageLines
			} );
		}

		errorCollection.get( firstMessageLine )!.pages.add( error.pageUrl );
	};
}

/**
 * Finds all links in opened page and filters out external, already discovered and explicitly excluded ones.
 */
async function getLinksFromPage(
	page: Page,
	{ baseUrl, foundLinks, exclusions }: { baseUrl: string; foundLinks: Array<string>; exclusions: Array<string> }
): Promise<Array<string>> {
	const links = await page.$$eval(
		`body a[href]:not([${ DATA_ATTRIBUTE_NAME }]):not([download])`,
		anchors => [ ...new Set( anchors
			.filter( anchor => /http(s)?:/.test( anchor.protocol ) )
			.map( anchor => `${ anchor.origin }${ anchor.pathname }` ) )
		]
	);

	return links.filter( link => {
		return link.startsWith( baseUrl ) && // Skip external link.
			!foundLinks.includes( link ) && // Skip already discovered link.
			!exclusions.some( exclusion => link.includes( exclusion ) ); // Skip explicitly excluded link.
	} );
}

/**
 * Finds all meta tags, that contain a pattern to ignore errors, and then returns a map between error type and these patterns.
 */
async function getErrorIgnorePatternsFromPage( page: Page ): Promise<Map<ErrorType, Set<string>>> {
	const metaTag = await page.$( `head > meta[name=${ META_TAG_NAME }]` );

	const patterns = new Map();

	// If meta tag is not defined, return an empty map.
	if ( !metaTag ) {
		return patterns;
	}

	const contentString = await metaTag.evaluate( metaTag => metaTag.getAttribute( 'content' ) );

	let content;

	try {
		// Try to parse value from meta tag...
		content = JSON.parse( contentString );
	} catch ( error ) {
		// ...but if it is not a valid JSON, return an empty map.
		return patterns;
	}

	Object.entries( content ).forEach( ( [ type, pattern ] ) => {
		const patternCollection = new Set( toArray( pattern )
			// Only string patterns are supported, as the error message produced by the crawler is always a string.
			.filter( pattern => typeof pattern === 'string' )
			// Only non-empty patterns are supported, because an empty pattern would cause all errors in a given type to be ignored.
			.filter( pattern => pattern.length > 0 )
		);

		if ( !patternCollection.size ) {
			return;
		}

		const errorType = PATTERN_TYPE_TO_ERROR_TYPE_MAP[ type as keyof typeof PATTERN_TYPE_TO_ERROR_TYPE_MAP ];

		patterns.set( errorType, patternCollection );
	} );

	return patterns;
}

/**
 * Iterates over all found errors from given link and marks errors as ignored, if their message match the ignore pattern.
 */
function markErrorsAsIgnored( errors: Array<CrawlerError>, errorIgnorePatterns: Map<ErrorType, Set<string>> ): void {
	errors.forEach( error => {
		// Skip, if there is no pattern defined for currently examined error type.
		if ( !errorIgnorePatterns.has( error.type ) ) {
			return;
		}

		// If at least one pattern matches the error message, mark currently examined error as ignored.
		const isIgnored = Array
			.from( errorIgnorePatterns.get( error.type )! )
			.some( pattern => {
				return pattern === IGNORE_ALL_ERRORS_WILDCARD ||
					util.stripVTControlCharacters( error.message ).includes( pattern ) ||
					error.failedResourceUrl?.includes( pattern );
			} );

		if ( isIgnored ) {
			error.ignored = true;
		}
	} );
}

/**
 * Checks, if HTTP request was a navigation one, i.e. request that is driving frame's navigation. Requests sent from child frames
 * (i.e. from <iframe>) are not treated as a navigation. Only a request from a top-level frame is navigation.
 */
function isNavigationRequest( request: any ): boolean {
	return request.isNavigationRequest() && request.frame().parentFrame() === null;
}

/**
 * Analyzes collected errors and logs them in the console.
 */
function logErrors( errors: Map<ErrorType, Map<string, ErrorCollection>> ): void {
	if ( !errors.size ) {
		console.log( chalk.green.bold( '\n✨ No errors have been found.\n' ) );
		return;
	}

	console.log( chalk.red.bold( '\n🔥 The following errors have been found:' ) );

	errors.forEach( ( errorCollection, errorType ) => {
		const numberOfErrors = errorCollection.size;
		const separator = chalk.gray( ' ➜ ' );
		const errorName = chalk.bgRed.white.bold( ` ${ errorType.description.toUpperCase() } ` );
		const errorSummary = chalk.red( `${ chalk.bold( numberOfErrors ) } ${ numberOfErrors > 1 ? 'errors' : 'error' }` );

		console.group( `\n${ errorName } ${ separator } ${ errorSummary }` );

		errorCollection.forEach( ( error, message ) => {
			console.group( `\n❌ ${ message }` );

			if ( error.details ) {
				console.log( error.details );
			}

			console.log( chalk.red( `\n…found on the following ${ error.pages.size > 1 ? 'pages' : 'page' }:` ) );

			error.pages.forEach( pageUrl => console.log( chalk.gray( `➥  ${ pageUrl }` ) ) );

			console.groupEnd();
		} );

		console.groupEnd();
	} );

	// Blank message only to separate the errors output log.
	console.log();
}
