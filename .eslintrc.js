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
		'**/node_modules/**',
		'packages/ckeditor5-dev-build-tools/tests/build/fixtures/src/input.ts'
	],
	rules: {
		'no-console': 'off',
		'ckeditor5-rules/require-file-extensions-in-imports': 'off',
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
			files: [ './packages/ckeditor5-dev-build-tools/tests/**/*' ],
			rules: {
				'mocha/no-global-tests': 'off'
			}
		}
	]
};
