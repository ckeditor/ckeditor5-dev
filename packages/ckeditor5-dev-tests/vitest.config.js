/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig( {
	test: {
		setupFiles: [
			'./tests/_utils/testsetup.js'
		],
		testTimeout: 10000,
		restoreMocks: true,
		clearMocks: true,
		mockReset: true,
		unstubEnvs: true,
		unstubGlobals: true,
		include: [
			'tests/**/*.js'
		],
		exclude: [
			'./tests/_utils/**/*.js',
			'./tests/fixtures/**/*.js'
		],
		coverage: {
			provider: 'v8',
			include: [
				'lib/**'
			],
			exclude: [
				'*.html'
			],
			reporter: [ 'text', 'json', 'html', 'lcov' ]
		}
	}
} );
