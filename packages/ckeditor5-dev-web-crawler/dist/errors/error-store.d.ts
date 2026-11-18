/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
import type { ErrorType } from "../constants.js";
import type { CrawlerError, ErrorCollection } from "../types.js";
export type ErrorStore = Map<ErrorType, Map<string, ErrorCollection>>;
/**
* Returns an empty collection for crawler errors.
*/
export declare function createErrorStore(): ErrorStore;
/**
* Returns an error collector, which is called every time new error is found.
*/
export declare function createErrorCollector(errors: ErrorStore): (error: CrawlerError) => void;
