#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

import { cpus } from 'os';

export interface ErrorType {

	/**
	 * The event name emitted by Puppeteer.
	 */
	event?: string;

	/**
	 * Human-readable description of the error.
	 */
	description: string;
}

export const DEFAULT_CONCURRENCY = cpus().length / 2;

export const DEFAULT_TIMEOUT = 15 * 1000;

export const DEFAULT_RESPONSIVENESS_CHECK_TIMEOUT = 1000;

export const DEFAULT_REMAINING_ATTEMPTS = 3;

export const ERROR_TYPES = {
	PAGE_CRASH: {
		event: 'error',
		description: 'Page crash'
	},
	REQUEST_FAILURE: {
		event: 'requestfailed',
		description: 'Request failure'
	},
	RESPONSE_FAILURE: {
		event: 'response',
		description: 'Response failure'
	},
	CONSOLE_ERROR: {
		event: 'console',
		description: 'Console error'
	},
	NAVIGATION_ERROR: {
		// Navigation error does not have the `event` property, because this error is not emitted by page.on() method as
		// event, but it is thrown as exception from page.goto() method.
		description: 'Navigation error'
	}
} as const satisfies Record<string, ErrorType>;

export const PATTERN_TYPE_TO_ERROR_TYPE_MAP = {
	'page-crash': ERROR_TYPES.PAGE_CRASH,
	'request-failure': ERROR_TYPES.REQUEST_FAILURE,
	'response-failure': ERROR_TYPES.RESPONSE_FAILURE,
	'console-error': ERROR_TYPES.CONSOLE_ERROR,
	'navigation-error': ERROR_TYPES.NAVIGATION_ERROR
} as const satisfies Record<string, ErrorType>;

export const IGNORE_ALL_ERRORS_WILDCARD = '*';

export const META_TAG_NAME = 'x-cke-crawler-ignore-patterns';

export const DATA_ATTRIBUTE_NAME = 'data-cke-crawler-skip';
