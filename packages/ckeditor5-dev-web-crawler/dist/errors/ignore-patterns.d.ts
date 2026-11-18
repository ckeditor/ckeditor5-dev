/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
import type { Page } from "puppeteer";
import { type ErrorType } from "../constants.js";
import type { CrawlerError } from "../types.js";
/**
* Finds all meta tags, that contain a pattern to ignore errors, and then returns a map between error type and these patterns.
*/
export declare function getErrorIgnorePatternsFromPage(page: Page): Promise<Map<ErrorType, Set<string>>>;
/**
* Iterates over all found errors from given link and marks errors as ignored, if their message match the ignore pattern.
*/
export declare function markErrorsAsIgnored(errors: Array<CrawlerError>, errorIgnorePatterns: Map<ErrorType, Set<string>>): void;
