#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

import { cpus } from 'os';

export const DEFAULT_CONCURRENCY = cpus().length / 2;

export const DEFAULT_TIMEOUT = 15 * 1000;

export const DEFAULT_RESPONSIVENESS_CHECK_TIMEOUT = 1000;

export const DEFAULT_REMAINING_ATTEMPTS = 3;

export const ERROR_TYPES = {
	PAGE_CRASH: {
		event: 'error',
		description: 'Page crash'
	},
	UNCAUGHT_EXCEPTION: {
		event: 'pageerror',
		description: 'Uncaught exception'
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
};

export const PATTERN_TYPE_TO_ERROR_TYPE_MAP = {
	'page-crash': ERROR_TYPES.PAGE_CRASH,
	'uncaught-exception': ERROR_TYPES.UNCAUGHT_EXCEPTION,
	'request-failure': ERROR_TYPES.REQUEST_FAILURE,
	'response-failure': ERROR_TYPES.RESPONSE_FAILURE,
	'console-error': ERROR_TYPES.CONSOLE_ERROR,
	'navigation-error': ERROR_TYPES.NAVIGATION_ERROR
};

export const IGNORE_ALL_ERRORS_WILDCARD = '*';

export const META_TAG_NAME = 'x-cke-crawler-ignore-patterns';

export const DATA_ATTRIBUTE_NAME = 'data-cke-crawler-skip';

export const SUCCESSFUL_HTTP_STATUS_CODES = [ 200, 201, 202, 203, 204, 205, 206, 207, 208, 226 ];
