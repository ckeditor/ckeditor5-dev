/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig( {
	test: {
		testTimeout: 20000,
		restoreMocks: true,
		include: [
			'tests/**/*.js'
		],
		exclude: [
			'tests/_utils.js'
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
