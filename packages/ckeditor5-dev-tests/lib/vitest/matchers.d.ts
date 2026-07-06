/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import 'vitest';

export interface MarkupMatcherResult {
	pass: boolean;
	message: () => string;
	actual?: string;
	expected?: string;
}

export declare function toEqualMarkup( received: string, expected: string ): MarkupMatcherResult;

export declare const markupMatchers: {
	toEqualMarkup: typeof toEqualMarkup;
};

declare module 'vitest' {
	interface Matchers<R = any> {

		/**
		 * Asserts that two markup strings are equal. Unlike `toEqual()`, it formats the markup before showing a diff.
		 */
		toEqualMarkup( expected: string ): R;
	}
}
