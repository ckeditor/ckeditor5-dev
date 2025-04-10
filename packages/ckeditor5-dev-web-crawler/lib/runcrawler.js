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
import { createSpinner, getProgressHandler } from './spinner.js';

import {
	DEFAULT_CONCURRENCY,
	DEFAULT_TIMEOUT,
	DEFAULT_RESPONSIVENESS_CHECK_TIMEOUT,
	DEFAULT_REMAINING_ATTEMPTS,
	ERROR_TYPES,
	PATTERN_TYPE_TO_ERROR_TYPE_MAP,
	IGNORE_ALL_ERRORS_WILDCARD,
	META_TAG_NAME,
	DATA_ATTRIBUTE_NAME
} from './constants.js';

/**
 * Main crawler function. Its purpose is to:
 * - create Puppeteer's browser instance,
 * - open simultaneously (up to concurrency limit) links from the provided URL in a dedicated Puppeteer's page for each link,
 * - show error summary after all links have been visited.
 *
 * @param {object} options Parsed CLI arguments.
 * @param {string} options.url The URL to start crawling. This argument is required.
 * @param {number} [options.depth=Infinity] Defines how many nested page levels should be examined. Infinity by default.
 * @param {Array.<string>} [options.exclusions=[]] An array of patterns to exclude links. Empty array by default to not exclude anything.
 * @param {number} [options.concurrency=1] Number of concurrent pages (browser tabs) to be used during crawling. One by default.
 * @param {boolean} [options.disableBrowserSandbox=false] Whether the browser should be created with the `--no-sandbox` flag.
 * @param {boolean} [options.noSpinner=false] Whether to display the spinner with progress or a raw message with current progress.
 * @param {boolean} [options.ignoreHTTPSErrors=false] Whether the browser should ignore invalid (self-signed) certificates.
 * @returns {Promise} Promise is resolved, when the crawler has finished the whole crawling procedure.
 */
export default async function runCrawler( options ) {
	const {
		url,
		depth = Infinity,
		exclusions = [],
		concurrency = DEFAULT_CONCURRENCY,
		disableBrowserSandbox = false,
		noSpinner = false,
		ignoreHTTPSErrors = false
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
		args: [],
		headless: true,
		ignoreHTTPSErrors
	};

	if ( disableBrowserSandbox ) {
		puppeteerOptions.args.push( '--no-sandbox' );
		puppeteerOptions.args.push( '--disable-setuid-sandbox' );
	}

	const errors = new Map();
	const foundLinks = [ url ];
	const spinner = createSpinner( { noSpinner } );
	const baseUrl = getBaseUrl( url );
	const onError = getErrorHandler( errors );
	const onProgress = getProgressHandler( spinner, { verbose: noSpinner } );

	const cluster = await Cluster.launch( {
		concurrency: Cluster.CONCURRENCY_CONTEXT,
		timeout: DEFAULT_RESPONSIVENESS_CHECK_TIMEOUT,
		maxConcurrency: concurrency,
		puppeteerOptions,
		monitor: true
	} );

	await cluster.task( async ( { page, data } ) => {
		const errors = [];

		page.setDefaultTimeout( DEFAULT_TIMEOUT );
		await page.setCacheEnabled( false );
		await page.setRequestInterception( true );

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

		page.on( ERROR_TYPES.PAGE_CRASH.event, error => errors.push( {
			pageUrl: page.url(),
			type: ERROR_TYPES.PAGE_CRASH,
			message: error.message || '(empty message)'
		} ) );

		page.on( ERROR_TYPES.UNCAUGHT_EXCEPTION.event, error => errors.push( {
			pageUrl: page.url(),
			type: ERROR_TYPES.UNCAUGHT_EXCEPTION,
			message: error.message || '(empty message)'
		} ) );

		page.on( ERROR_TYPES.REQUEST_FAILURE.event, request => {
			const errorText = request.failure().errorText;

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

				errors.push( {
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

				errors.push( {
					pageUrl: isNavigation ? data.parentUrl : page.url(),
					type: ERROR_TYPES.RESPONSE_FAILURE,
					message: `${ message } (HTTP response status code: ${ chalk.bold( responseStatus ) })`,
					failedResourceUrl: url
				} );
			}
		} );

		const session = await page.target().createCDPSession();

		await session.send( 'Runtime.enable' );

		session.on( 'Runtime.exceptionThrown', event => {
			const message = event.exceptionDetails.exception?.description ||
				event.exceptionDetails.exception?.value ||
				event.exceptionDetails.text ||
				'(No description provided)';

			errors.push( {
				pageUrl: page.url(),
				type: ERROR_TYPES.CONSOLE_ERROR,
				message
			} );
		} );

		onProgress( {
			total: foundLinks.length
		} );

		try {
			await page.goto( data.url, { waitUntil: [ 'load', 'networkidle0' ] } );
		} catch ( error ) {
			const errorMessage = error.message || '(empty message)';

			// All navigation errors starting with the `net::` prefix are already covered by the "request" error handler, so it should
			// not be also reported as the "navigation error".
			const ignoredMessage = 'net::';

			if ( !errorMessage.startsWith( ignoredMessage ) ) {
				errors.push( {
					pageUrl: data.url,
					type: ERROR_TYPES.NAVIGATION_ERROR,
					message: errorMessage
				} );
			}
		}

		// Create patterns from meta tags to ignore errors.
		const errorIgnorePatterns = await getErrorIgnorePatternsFromPage( page );

		// Iterates over recently found errors to mark them as ignored ones, if they match the patterns.
		markErrorsAsIgnored( errors, errorIgnorePatterns );

		// Skip crawling deeper, if the bottom has been reached, or get all unique links from the page body otherwise.
		const links = data.remainingNestedLevels === 0 ?
			[] :
			await getLinksFromPage( page, { baseUrl, foundLinks, exclusions } );

		errors
			.filter( error => !error.ignored )
			.forEach( error => onError( error ) );

		links.forEach( link => {
			foundLinks.push( link );

			cluster.queue( {
				url: link,
				parentUrl: data.parentUrl,
				remainingNestedLevels: data.remainingNestedLevels - 1,
				remainingAttempts: data.remainingAttempts
			} );
		} );
	} );

	spinner.start( 'Checking pages…' );

	// Queue the first link to be crawled.
	cluster.queue( {
		url,
		parentUrl: '(none)',
		remainingNestedLevels: depth,
		remainingAttempts: DEFAULT_REMAINING_ATTEMPTS
	} );

	spinner.succeed( `Checking pages… ${ chalk.bold( 'Done' ) }` );

	await cluster.idle();
	await cluster.close();

	logErrors( errors );

	// Always exit the script because `spinner` can freeze the process of the crawler if it is executed in the `noSpinner:true` mode.
	process.exit( errors.size ? 1 : 0 );
}

/**
 * Returns an error handler, which is called every time new error is found.
 *
 * @param {Map.<ErrorType, ErrorCollection>} errors All errors grouped by their type.
 * @returns {Function} Error handler.
 */
function getErrorHandler( errors ) {
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
		const firstMessageLine = messageLines.shift();
		const nextMessageLines = messageLines.join( '\n' );

		const errorCollection = errors.get( error.type );

		if ( !errorCollection.has( firstMessageLine ) ) {
			errorCollection.set( firstMessageLine, {
				// Store only unique pages, because given error can occur multiple times on the same page.
				pages: new Set(),
				details: nextMessageLines
			} );
		}

		errorCollection.get( firstMessageLine ).pages.add( error.pageUrl );
	};
}

/**
 * Finds all links in opened page and filters out external, already discovered and explicitly excluded ones.
 *
 * @param {object} page The page instance from Puppeteer.
 * @param {object} data All data needed for crawling the link.
 * @param {string} data.baseUrl The base URL from the initial page URL.
 * @param {Array.<string>} data.foundLinks An array of all links, which have been already discovered.
 * @param {Array.<string>} data.exclusions An array patterns to exclude links. Empty array by default to not exclude anything.
 * @returns {Promise.<Array.<string>>} A promise, which resolves to an array of unique links.
 */
async function getLinksFromPage( page, { baseUrl, foundLinks, exclusions } ) {
	const evaluatePage = anchors => [ ...new Set( anchors
		.filter( anchor => /http(s)?:/.test( anchor.protocol ) )
		.map( anchor => `${ anchor.origin }${ anchor.pathname }` ) )
	];

	return ( await page.$$eval( `body a[href]:not([${ DATA_ATTRIBUTE_NAME }])`, evaluatePage ) )
		.filter( link => {
			// Skip external link.
			if ( !link.startsWith( baseUrl ) ) {
				return false;
			}

			// Skip already discovered link.
			if ( foundLinks.includes( link ) ) {
				return false;
			}

			// Skip explicitly excluded link.
			if ( exclusions.some( exclusion => link.includes( exclusion ) ) ) {
				return false;
			}

			return true;
		} );
}

/**
 * Finds all meta tags, that contain a pattern to ignore errors, and then returns a map between error type and these patterns.
 *
 * @param {object} page The page instance from Puppeteer.
 * @returns {Promise.<Map.<ErrorType, Set.<string>>>} A promise, which resolves to a map between an error type and a set of patterns.
 */
async function getErrorIgnorePatternsFromPage( page ) {
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

		const errorType = PATTERN_TYPE_TO_ERROR_TYPE_MAP[ type ];

		patterns.set( errorType, patternCollection );
	} );

	return patterns;
}

/**
 * Iterates over all found errors from given link and marks errors as ignored, if their message match the ignore pattern.
 *
 * @param {Array.<Error>} errors An array of errors to check.
 * @param {Map.<ErrorType, Set.<string>>} errorIgnorePatterns A map between an error type and a set of patterns.
 */
function markErrorsAsIgnored( errors, errorIgnorePatterns ) {
	errors.forEach( error => {
		// Skip, if there is no pattern defined for currently examined error type.
		if ( !errorIgnorePatterns.has( error.type ) ) {
			return;
		}

		const patterns = [ ...errorIgnorePatterns.get( error.type ) ];

		const isPatternMatched = pattern => {
			if ( pattern === IGNORE_ALL_ERRORS_WILDCARD ) {
				return true;
			}

			if ( util.stripVTControlCharacters( error.message ).includes( pattern ) ) {
				return true;
			}

			if ( error.failedResourceUrl && error.failedResourceUrl.includes( pattern ) ) {
				return true;
			}

			return false;
		};

		// If at least one pattern matches the error message, mark currently examined error as ignored.
		if ( patterns.some( isPatternMatched ) ) {
			error.ignored = true;
		}
	} );
}

/**
 * Checks, if HTTP request was a navigation one, i.e. request that is driving frame's navigation. Requests sent from child frames
 * (i.e. from <iframe>) are not treated as a navigation. Only a request from a top-level frame is navigation.
 *
 * @param {object} request The Puppeteer's HTTP request instance.
 * @returns {boolean}
 */
function isNavigationRequest( request ) {
	return request.isNavigationRequest() && request.frame().parentFrame() === null;
}

/**
 * Analyzes collected errors and logs them in the console.
 *
 * @param {Map.<ErrorType, ErrorCollection>} errors All found errors grouped by their type.
 */
function logErrors( errors ) {
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

/**
 * @typedef {Object.<string, String|Number>} Link
 * @property {string} url The URL associated with the link.
 * @property {string} parentUrl The page on which the link was found.
 * @property {number} remainingNestedLevels The remaining number of nested levels to be checked. If this value is 0, the
 * requested traversing depth has been reached and nested links from the URL associated with this link are not collected anymore.
 * @property {number} remainingAttempts The total number of reopenings allowed for the given link.
 */

/**
 * @typedef {Object.<string, String>} ErrorType
 * @property {string} [event] The event name emitted by Puppeteer.
 * @property {string} description Human-readable description of the error.
 */

/**
 * @typedef {Object.<string, String|Boolean|ErrorType>} Error
 * @property {string} pageUrl The URL, where error has occurred.
 * @property {ErrorType} type Error type.
 * @property {string} message Error message.
 * @property {string} [failedResourceUrl] Full resource URL, that has failed. Necessary for matching against exclusion patterns.
 * @property {boolean} [ignored] Indicates that error should be ignored, because its message matches the exclusion pattern.
 */

/**
 * @typedef {Object.<string, Set.<string>>} ErrorOccurrence
 * @property {Set.<string>} pages A set of unique pages, where error has been found.
 * @property {Set.<string>} [details] Additional error details (i.e. an error stack).
 */

/**
 * @typedef {Map.<string, ErrorOccurrence>} ErrorCollection
 * @property {ErrorOccurrence} [*] Error message.
 */

/**
 * @typedef {Object.<string, Array.<string>>} ErrorsAndLinks Collection of unique errors and links.
 * @property {Array.<string>} errors An array of errors.
 * @property {Array.<string>} links An array of links.
 */
