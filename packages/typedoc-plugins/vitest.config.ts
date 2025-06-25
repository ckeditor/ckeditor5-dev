/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig( {
	test: {
		testTimeout: 1000 * 60,
		hookTimeout: 1000 * 60,
		mockReset: false,
		restoreMocks: false,
		include: [
			'tests/**/*.ts'
		],
		exclude: [
			'tests/utils.ts',
			'tests/*/utils/**/*.ts',
			'tests/**/fixtures/**/*.ts'
		],
		coverage: {
			provider: 'v8',
			include: [
				'src/**'
			],
			reporter: [ 'text', 'json', 'html', 'lcov' ]
		}
	}
} );
