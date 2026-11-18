/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
import type { PageEvents } from "puppeteer";
export interface ErrorType<TEvent extends keyof PageEvents = keyof PageEvents> {
	/**
	* The event name emitted by Puppeteer.
	*/
	event?: TEvent;
	/**
	* Human-readable description of the error.
	*/
	description: string;
}
interface EventErrorType<TEvent extends keyof PageEvents> extends ErrorType<TEvent> {
	event: TEvent;
}
interface ErrorTypes {
	PAGE_CRASH: EventErrorType<"error">;
	UNCAUGHT_EXCEPTION: EventErrorType<"pageerror">;
	REQUEST_FAILURE: EventErrorType<"requestfailed">;
	RESPONSE_FAILURE: EventErrorType<"response">;
	CONSOLE_ERROR: EventErrorType<"console">;
	NAVIGATION_ERROR: ErrorType;
}
/**
* Errors from the following hosts will be ignored.
*/
export declare const IGNORED_HOSTS: Array<string>;
export declare const DEFAULT_CONCURRENCY: number;
export declare const DEFAULT_TIMEOUT: number;
export declare const DEFAULT_RETRIES = 3;
export declare const DEFAULT_RETRY_DELAY = 1e3;
/**
* How long the network must be idle after the `load` event before the crawler considers a page loaded.
*/
export declare const NETWORK_IDLE_TIME = 250;
export declare const ERROR_TYPES: ErrorTypes;
export declare const PATTERN_TYPE_TO_ERROR_TYPE_MAP: Record<string, ErrorType>;
export declare const IGNORE_ALL_ERRORS_WILDCARD = "*";
export declare const META_TAG_NAME = "x-cke-crawler-ignore-patterns";
export declare const DATA_ATTRIBUTE_NAME = "data-cke-crawler-skip";
export {};
