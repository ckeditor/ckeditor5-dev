/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig( {
	test: {
		testTimeout: 10000,
		restoreMocks: true,
		clearMocks: true,
		mockReset: true,
		unstubEnvs: true,
		unstubGlobals: true,
		include: [
			'tests/**/*.ts'
		],
		coverage: {
			provider: 'v8',
			include: [
				'src/**'
			],
			exclude: [
				'tests/**',
				'src/types.ts',
				'src/index.ts'
			],
			reporter: [ 'text', 'json', 'html', 'lcov' ]
		}
	}
} );
