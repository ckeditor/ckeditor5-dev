/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	extends: 'ckeditor5',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module'
	},
	env: {
		node: true
	},
	ignorePatterns: [
		'**/dist/*',
		'**/coverage/**',
		'**/node_modules/**',
		'**/release/**',

		// ESLint does not understand `import ... with { ... }`.
		// See: https://github.com/eslint/eslint/discussions/15305.
		'packages/ckeditor5-dev-ci/lib/data/index.js',
		'packages/ckeditor5-dev-build-tools/tests/build/fixtures/src/input.ts'
	],
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
};
