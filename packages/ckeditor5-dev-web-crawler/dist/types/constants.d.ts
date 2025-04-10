#!/usr/bin/env node
/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
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
export declare const DEFAULT_CONCURRENCY: number;
export declare const DEFAULT_TIMEOUT: number;
export declare const DEFAULT_RESPONSIVENESS_CHECK_TIMEOUT = 1000;
export declare const DEFAULT_REMAINING_ATTEMPTS = 3;
export declare const ERROR_TYPES: {
    readonly PAGE_CRASH: {
        readonly event: "error";
        readonly description: "Page crash";
    };
    readonly REQUEST_FAILURE: {
        readonly event: "requestfailed";
        readonly description: "Request failure";
    };
    readonly RESPONSE_FAILURE: {
        readonly event: "response";
        readonly description: "Response failure";
    };
    readonly CONSOLE_ERROR: {
        readonly event: "console";
        readonly description: "Console error";
    };
    readonly NAVIGATION_ERROR: {
        readonly description: "Navigation error";
    };
};
export declare const PATTERN_TYPE_TO_ERROR_TYPE_MAP: {
    readonly 'page-crash': {
        readonly event: "error";
        readonly description: "Page crash";
    };
    readonly 'request-failure': {
        readonly event: "requestfailed";
        readonly description: "Request failure";
    };
    readonly 'response-failure': {
        readonly event: "response";
        readonly description: "Response failure";
    };
    readonly 'console-error': {
        readonly event: "console";
        readonly description: "Console error";
    };
    readonly 'navigation-error': {
        readonly description: "Navigation error";
    };
};
export declare const IGNORE_ALL_ERRORS_WILDCARD = "*";
export declare const META_TAG_NAME = "x-cke-crawler-ignore-patterns";
export declare const DATA_ATTRIBUTE_NAME = "data-cke-crawler-skip";
