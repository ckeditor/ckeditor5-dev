/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { defineConfig } from 'vitest/config';

const ROOT_DIRECTORY = upath.toUnix( import.meta.dirname );

// One project per package. Each project inherits the `test` options defined at the root
// and its paths are relative to the package directory.
export default defineConfig( {
	root: ROOT_DIRECTORY,
	test: {
		testTimeout: 10000,
		restoreMocks: true,
		clearMocks: true,
		mockReset: true,
		unstubEnvs: true,
		unstubGlobals: true,
		projects: [
			defineProject( 'ckeditor5-dev-agents', {
				include: [ 'tests/**/*.ts' ],
				exclude: [ 'tests/_utils/**/*.ts' ]
			} ),
			defineProject( 'ckeditor5-dev-build-tools', {
				include: [ 'tests/**/*.ts' ],
				exclude: [ 'tests/_utils/**/*.ts', 'tests/**/fixtures/**/*.ts' ]
			} ),
			defineProject( 'ckeditor5-dev-changelog', {
				include: [ 'tests/**/*.ts' ]
			} ),
			defineProject( 'ckeditor5-dev-ci', {
				include: [ 'tests/**/*.js' ]
			} ),
			defineProject( 'ckeditor5-dev-docs', {
				testTimeout: 20000,
				hookTimeout: 20000,
				unstubGlobals: false,
				include: [ 'tests/**/*.js' ]
			} ),
			defineProject( 'ckeditor5-dev-license-checker', {
				include: [ 'tests/**/*.ts' ]
			} ),
			defineProject( 'ckeditor5-dev-manual-server', {
				include: [ 'tests/**/*.ts' ],
				exclude: [ 'tests/_utils/**/*.ts' ]
			} ),
			defineProject( 'ckeditor5-dev-release-tools', {
				unstubGlobals: false,
				include: [ 'tests/**/*.js' ]
			}, [ executeInParallelVirtualModulePlugin() ] ),
			defineProject( 'ckeditor5-dev-stale-bot', {
				include: [ 'tests/**/*.js' ]
			} ),
			defineProject( 'ckeditor5-dev-translations', {
				include: [ 'tests/**/*.js' ]
			} ),
			defineProject( 'ckeditor5-dev-utils', {
				unstubGlobals: false,
				include: [ 'tests/**/*.ts' ]
			} ),
			defineProject( 'ckeditor5-dev-web-crawler', {
				include: [ 'tests/**/*.ts' ]
			} ),
			defineProject( 'typedoc-plugins', {
				testTimeout: 1000 * 60,
				hookTimeout: 1000 * 60,
				// The tests create spies in `beforeAll()`, so their recorded calls must survive between tests.
				clearMocks: false,
				mockReset: false,
				include: [ 'tests/**/*.ts' ],
				exclude: [ 'tests/utils.ts', 'tests/*/utils/**/*.ts', 'tests/**/fixtures/**/*.ts' ]
			} )
		],
		coverage: {
			provider: 'v8',
			include: [
				'packages/*/src/**',
				'packages/*/lib/**',
				'packages/ckeditor5-dev-manual-server/theme/catalog-favorites.ts',
				'packages/ckeditor5-dev-manual-server/theme/catalog-search.ts'
			],
			exclude: [
				// The package has no tests.
				'packages/ckeditor5-dev-bump-year/**',
				'packages/{ckeditor5-dev-agents,ckeditor5-dev-changelog,ckeditor5-dev-license-checker}/src/{types,index}.ts',
				'packages/ckeditor5-dev-stale-bot/**/*.graphql',
				'packages/ckeditor5-dev-translations/**/*.ts'
			],
			reporter: [ 'text', 'json', 'html', 'lcov' ]
		}
	}
} );

/**
 * @param {string} name The package directory name. It is also the project name, so `vitest --project <name>` runs its tests.
 * @param {import('vitest/node').TestProjectInlineConfiguration['test']} test
 * @param {Array.<import('vite').Plugin>} [plugins]
 * @returns {import('vitest/node').TestProjectInlineConfiguration}
 */
function defineProject( name, test, plugins = [] ) {
	return {
		root: upath.join( ROOT_DIRECTORY, 'packages', name ),
		plugins,
		test: {
			name,
			...test
		}
	};
}

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
