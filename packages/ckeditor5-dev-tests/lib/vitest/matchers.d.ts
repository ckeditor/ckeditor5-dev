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

declare module 'vitest' {
	// The type parameter must be named `T` to match the `Matchers` declaration in Vitest,
	// as interface merging requires identical type parameter lists.
	interface Matchers<T = any> {

		/**
		 * Asserts that two markup strings are equal. Unlike `toEqual()`, it formats the markup before showing a diff.
		 */
		toEqualMarkup( expected: string ): T;
	}
}
