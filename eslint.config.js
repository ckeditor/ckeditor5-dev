/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { readdirSync } from 'node:fs';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import ckeditor5Rules from 'eslint-plugin-ckeditor5-rules';
import ckeditor5Config from 'eslint-config-ckeditor5';
import vitest from '@vitest/eslint-plugin';

const projectPackages = readdirSync( upath.join( import.meta.dirname, 'packages' ), { withFileTypes: true } )
	.filter( dirent => dirent.isDirectory() )
	.map( dirent => dirent.name );

export default defineConfig( [
	{
		ignores: [
			// Test fixtures are sample inputs (incl. CSS) and must not be linted.
			'**/tests/**/fixtures/**',
			'**/dist/*',
			'**/coverage/**',
			'**/release/**'
		]
	},
	{
		extends: ckeditor5Config,

		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.node
			}
		},

		linterOptions: {
			reportUnusedDisableDirectives: 'warn',
			reportUnusedInlineConfigs: 'warn'
		},

		plugins: {
			'ckeditor5-rules': ckeditor5Rules
		},

		rules: {
			'no-console': 'off',
			'ckeditor5-rules/license-header': [ 'error', {
				headerLines: [
					'/**',
					' * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.',
					' * For licensing, see LICENSE.md.',
					' */'
				]
			} ],
			'ckeditor5-rules/require-file-extensions-in-imports': [
				'error',
				{
					extensions: [ '.ts', '.js', '.json' ]
				}
			],
			'ckeditor5-rules/no-scoped-imports-within-package': 'error'
		}
	},
	{
		// Manual-server theme styles the dev tool's own chrome (shadow DOM of `<ck-manual-header>`, the catalog
		// page, the refresh prompt). It is not editor theme styling and never ships to a browser we do not
		// control, so the rules guarding themeability and cross-browser reach do not apply.
		files: [ 'packages/ckeditor5-dev-manual-server/theme/**/*.css' ],

		rules: {
			'ckeditor5-rules/no-disallowed-color-formats': 'off',

			// Runs in the developer's own modern browser only, so `::highlight`, `backdrop-filter`
			// and `ui-monospace` need no baseline guarantee.
			'css/use-baseline': 'off',

			// TODO (RTL): off pending a migration of physical properties/values to logical, the same way
			// the `ckeditor5` repository defers it.
			'css/prefer-logical-properties': 'off'
		}
	},
	{
		files: [ 'packages/*/tests/**', 'scripts-tests/**' ],

		plugins: {
			vitest
		},

		rules: {
			'vitest/consistent-test-it': [ 'error', { fn: 'it' } ],
			'vitest/require-top-level-describe': 'error'
		}
	},
	{
		extends: ckeditor5Config,

		files: [ '.changelog/**/*.md' ],

		plugins: {
			'ckeditor5-rules': ckeditor5Rules
		},

		rules: {
			'ckeditor5-rules/validate-changelog-entry': [ 'error', {
				allowedScopes: projectPackages,
				repositoryType: 'mono'
			} ]
		}
	}
] );
