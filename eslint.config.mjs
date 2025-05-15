/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import globals from 'globals';
import { defineConfig } from 'eslint/config';
import ckeditor5Rules from 'eslint-plugin-ckeditor5-rules';
import ckeditor5Config from 'eslint-config-ckeditor5';

export default defineConfig( [
	{
		ignores: [
			'**/dist/*',
			'**/coverage/**',
			'**/release/**',

			// TypeScript added support for import attributes in 5.3.0. We can remove this ignore when we upgrade to it.
			'packages/ckeditor5-dev-build-tools/tests/build/fixtures/src/input.ts'
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
					' * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.',
					' * For licensing, see LICENSE.md.',
					' */'
				]
			} ]
		}
	},
	{
		files: [ 'packages/ckeditor5-dev-tests/lib/**/*.@(js|ts)' ],

		languageOptions: {
			globals: {
				...globals.mocha,
				...globals.browser,
				'__karma__': true,
				CKEditorInspector: true,
				io: true
			}
		}
	}
] );
