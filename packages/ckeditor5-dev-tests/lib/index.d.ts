/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export { markupMatchers, toEqualMarkup, MarkupMatcherResult } from './vitest/matchers.js';

export declare function runAutomatedTests( options: Record<string, unknown> ): Promise<void>;
export declare function runManualTests( options: Record<string, unknown> ): Promise<void>;
