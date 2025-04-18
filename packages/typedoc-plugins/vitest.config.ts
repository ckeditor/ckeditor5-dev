/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig( {
	test: {
		setupFiles: [
			// './tests/_utils/testsetup.js'
		],
		testTimeout: 10000,
		mockReset: false,
		restoreMocks: false,
		include: [
			'tests/**/*.ts'
		],
		exclude: [
			'./tests/utils.ts',
			'./tests/*/utils/**/*.@(js|ts)',
			'./tests/*/fixtures/**/*.@(js|ts)'
		],
		coverage: {
			provider: 'v8',
			include: [
				'lib/**'
			],

			reporter: [ 'text', 'json', 'html', 'lcov' ]
		}
	}
} );
