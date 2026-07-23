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

const projectPackages = readdirSync( upath.join( import.meta.dirname, 'packages' ), { withFileTypes: true } )
	.filter( dirent => dirent.isDirectory() )
	.map( dirent => dirent.name );

export default defineConfig( [
	{
		ignores: [
			// Manual-server theme is dev-tool UI / vendored CSS (not editor styles); not part of the stylelint→eslint migration (#4267).
			'packages/ckeditor5-dev-manual-server/theme/**/*.css',

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
			'mocha/no-global-tests': 'off',
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
