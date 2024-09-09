/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	extends: 'ckeditor5',
	env: {
		node: true
	},
	ignorePatterns: [
		'**/dist/*',
		'**/coverage/**',
		'**/node_modules/**'
	],
	rules: {
		'no-console': 'off',
		'ckeditor5-rules/require-file-extensions-in-imports': 'off',
		'mocha/no-global-tests': 'off', // TODO: remove when all mocha tests are removed.
		'ckeditor5-rules/license-header': [ 'error', {
			headerLines: [
				'/**',
				' * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.',
				' * For licensing, see LICENSE.md.',
				' */'
			]
		} ]
	},
	overrides: [
		{
			files: [
				// TODO: add packages as they are migrated to ESM.
				'./packages/ckeditor5-dev-stale-bot/**/*'
			],
			rules: {
				'mocha/no-global-tests': 'error',
				'ckeditor5-rules/require-file-extensions-in-imports': [
					'error',
					{
						extensions: [ '.ts', '.js', '.json' ]
					}
				]
			}
		}
	]
};
