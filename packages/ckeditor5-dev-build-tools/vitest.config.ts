/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig( {
	test: {
		testTimeout: 10000,
		restoreMocks: true,
		coverage: {
			provider: 'v8',
			include: [
				'src/**'
			],
			reporter: [ 'text', 'json', 'html', 'lcov' ]
		}
	}
} );
