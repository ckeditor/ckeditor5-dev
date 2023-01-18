#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

const runCrawler = require( './runcrawler' );
const { getBaseUrl, isUrlValid, toArray } = require( './utils' );
const { DEFAULT_CONCURRENCY } = require( './constants' );

module.exports = {
	DEFAULT_CONCURRENCY,
	runCrawler,
	getBaseUrl,
	isUrlValid,
	toArray
};
