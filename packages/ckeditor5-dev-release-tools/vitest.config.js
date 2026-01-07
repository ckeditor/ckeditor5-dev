/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig( {
	plugins: [
		executeInParallelVirtualModulePlugin()
	],
	test: {
		setupFiles: [
			'./tests/_utils/testsetup.js'
		],
		testTimeout: 10000,
		mockReset: true,
		restoreMocks: true,
		include: [
			'tests/**/*.js'
		],
		exclude: [
			'./tests/_utils/**/*.js'
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

function executeInParallelVirtualModulePlugin() {
	const virtualModuleId = 'virtual:parallelworker-integration-module';
	const resolvedVirtualModuleId = '\0' + virtualModuleId;

	return {
		name: 'execute-in-parallel-virtual-module-plugin',
		resolveId( id ) {
			if ( id === virtualModuleId ) {
				return resolvedVirtualModuleId;
			}
		},
		load( id ) {
			if ( id === resolvedVirtualModuleId ) {
				return 'export default function virtualModule() {}';
			}
		}
	};
}
