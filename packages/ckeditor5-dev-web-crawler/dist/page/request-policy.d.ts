/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
import type { HTTPRequest } from "puppeteer";
export declare const REQUEST_ABORT_REASON = "blockedbyclient";
/**
* Returns true when request should be blocked by the crawler.
*/
export declare function shouldAbortRequest(request: HTTPRequest): boolean;
