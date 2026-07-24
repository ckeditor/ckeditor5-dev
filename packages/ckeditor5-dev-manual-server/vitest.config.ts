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
		coverage: {
			provider: 'v8',
			include: [
				'src/**',
				'theme/catalog-favorites.ts',
				'theme/catalog-search.ts'
			],
			reporter: [ 'text', 'json', 'html', 'lcov' ]
		}
	}
} );
