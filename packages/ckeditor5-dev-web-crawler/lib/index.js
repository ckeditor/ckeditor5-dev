#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

import runCrawler from './runcrawler.js';
import { getBaseUrl, isUrlValid, toArray } from './utils.js';
import { DEFAULT_CONCURRENCY } from './constants.js';

export default {
	DEFAULT_CONCURRENCY,
	runCrawler,
	getBaseUrl,
	isUrlValid,
	toArray
};
