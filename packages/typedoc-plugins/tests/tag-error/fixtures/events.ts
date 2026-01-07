/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/events
 */

/**
 * @see https://github.com/ckeditor/ckeditor5/issues/13362
 */

/**
 * Fired when error occurs.
 *
 * @eventName error
 * @param error Error message.
 */
export type ErrorEvent = {
	name: 'error';
	args: [ error: string ];
};

/**
 * Fired when error occurs.
 *
 * @eventName prefix-error
 * @param error Error message.
 */
export type PrefixErrorEvent = {
	name: 'error';
	args: [ error: string ];
};

/**
 * Fired when error occurs.
 *
 * @eventName error-suffix
 * @param error Error message.
 */
export type ErrorSuffixEvent = {
	name: 'error';
	args: [ error: string ];
};
