/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export { markupMatchers, toEqualMarkup } from './vitest/matchers.js';

/**
 * The test runner tasks are exposed as lazy wrappers, so importing this module does not load their
 * Node.js-only dependencies. Thanks to that, the module can be safely imported in a Vitest setup file
 * executed in a browser (to register the custom matchers).
 */

export async function runAutomatedTests( options ) {
	const { default: task } = await import( './tasks/runautomatedtests.js' );

	return task( options );
}

export async function runManualTests( options ) {
	const { default: task } = await import( './tasks/runmanualtests.js' );

	return task( options );
}
