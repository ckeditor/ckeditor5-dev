/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	extends: 'eslint:recommended',
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module'
	},
	env: {
		es6: true,
		mocha: true
	},
	globals: {
		expect: true,
		sinon: true
	},
	plugins: [
		'ckeditor5-rules',
		'mocha'
	],
	rules: {
		// ## Possible errors
		// Offing because we keep the browser env disabled so when using a console you need to define
		// it as a global variable anyway.
		'no-console': 'off',
		// Offing because there's nothing wrong with good `while ( true )` with a return statement.
		'no-constant-condition': 'off',

		// ## Best practices
		'curly': [
			'error',
			'all'
		],
		'dot-location': [
			'error',
			'property'
		],
		'dot-notation': 'error',
		'no-alert': 'error',
		'no-caller': 'error',
		'no-case-declarations': 'error',
		'no-eval': 'error',
		'no-extend-native': 'error',
		'no-implicit-coercion': [
			'error',
			{
				'boolean': false,
				'string': true,
				'number': true
			}
		],
		'no-implied-eval': 'error',
		// Brings more trouble than profit. When defining callbacks which are called in a specific context,
		// or when defining functions which are later assigned to some objects.
		// 'no-invalid-this': 'error',
		'no-labels': 'error',
		'no-lone-blocks': 'error',
		// Brings more confusion than profit. Especially useless when using `map()` or `filter()`
		// inside some other loops.
		// 'no-loop-func': 'error',
		'no-multi-spaces': 'error',
		'no-multi-str': 'error',
		'no-new': 'error',
		'no-new-func': 'error',
		'no-new-wrappers': 'error',
		'no-return-assign': 'error',
		'no-self-compare': 'error',
		'no-sequences': 'error',
		// We can't use it because of https://github.com/eslint/eslint/issues/2102
		// 'no-unused-expressions': 'error',
		'no-useless-call': 'error',
		'no-useless-concat': 'error',
		'no-useless-escape': 'error',
		'no-useless-return': 'error',
		'no-void': 'error',
		'no-with': 'error',
		'wrap-iife': 'error',
		'yoda': [
			'error',
			'never'
		],

		// ## Variables
		'no-use-before-define': [
			'error',
			{
				functions: false,
				classes: false,
				variables: true
			}
		],

		// ## Stylistic issues
		'array-bracket-spacing': [
			'error',
			'always'
		],
		'block-spacing': [
			'error',
			'always'
		],
		// We can't use this rule because we allow comments before `else`.
		// Make sure to report such case to ESLint.
		// 'brace-style': [
		// 	'error',
		// 	'1tbs'
		// ],
		'camelcase': [
			'error',
			{
				'properties': 'never'
			}
		],
		'comma-dangle': [ 'error', 'never' ],
		'comma-spacing': [
			'error',
			{
				'before': false,
				'after': true
			}
		],
		'comma-style': [
			'error',
			'last'
		],
		'computed-property-spacing': [
			'error',
			'always'
		],
		'consistent-this': [
			'error',
			'that'
		],
		'eol-last': [
			'error',
			'always'
		],
		'func-call-spacing': [
			'error',
			'never'
		],
		'indent': [
			'error',
			'tab',
			{
				'SwitchCase': 1
			}
		],
		'keyword-spacing': 'error',
		'key-spacing': 'error',
		'linebreak-style': [
			'error',
			'unix'
		],
		'lines-around-comment': [
			'error',
			{
				beforeBlockComment: true,
				allowObjectStart: true,
				allowBlockStart: true,
				allowArrayStart: true
			}
		],
		'max-len': [
			'error',
			140
		],
		'max-statements-per-line': [
			'error',
			{
				max: 1
			}
		],
		'new-cap': 'error',
		'new-parens': 'error',
		'no-array-constructor': 'error',
		'no-multiple-empty-lines': [
			'error',
			{
				max: 1
			}
		],
		'no-nested-ternary': 'error',
		'no-new-object': 'error',
		'no-trailing-spaces': 'error',
		'no-whitespace-before-property': 'error',
		'object-curly-spacing': [
			'error',
			'always'
		],
		'one-var': [
			'error',
			{
				initialized: 'never'
			}
		],
		'operator-linebreak': [
			'error',
			'after'
		],
		'padded-blocks': [
			'error',
			'never'
		],
		'quote-props': [
			'error',
			'as-needed',
			{
				'unnecessary': false
			}
		],
		'quotes': [
			'error',
			'single'
		],
		'semi': 'error',
		'semi-spacing': [
			'error',
			{
				before: false,
				after: true
			}
		],
		'space-before-blocks': [
			'error',
			'always'
		],
		'space-before-function-paren': [
			'error',
			{
				anonymous: 'never',
				named: 'never',
				asyncArrow: 'always'
			}
		],
		'space-infix-ops': 'error',
		'space-in-parens': [
			'error',
			'always'
		],
		'space-unary-ops': [
			'error',
			{
				words: true,
				nonwords: false
			}
		],
		'spaced-comment': [
			'error',
			'always'
		],
		'template-tag-spacing': [
			'error',
			'never'
		],
		'unicode-bom': [
			'error',
			'never'
		],

		// ## ECMAScript 6
		'arrow-parens': [
			'error',
			'as-needed'
		],
		'arrow-spacing': 'error',
		// This is too pedantic. It makes writing callbacks such as `value => value ? 1 : 2` impossible
		// 'no-confusing-arrow': 'error',
		'generator-star-spacing': [
			'error',
			'after'
		],
		'no-duplicate-imports': 'error',
		'no-useless-computed-key': 'error',
		'no-useless-constructor': 'error',
		'no-var': 'error',
		'object-shorthand': 'error',
		'prefer-const': [
			'error',
			{
				destructuring: 'all',
				ignoreReadBeforeAssign: true
			}
		],
		'prefer-rest-params': 'error',
		'prefer-spread': 'error',
		'symbol-description': 'error',
		'template-curly-spacing': [
			'error',
			'always'
		],
		'yield-star-spacing': [
			'error',
			'after'
		],
		'ckeditor5-rules/no-relative-imports': 'error',
		'mocha/handle-done-callback': 'error',
		'mocha/no-async-describe': 'error',
		'mocha/no-exclusive-tests': 'error',
		'mocha/no-global-tests': 'error',
		'mocha/no-identical-title': 'warn',
		'mocha/no-nested-tests': 'error',
		'mocha/no-pending-tests': 'error',
		'mocha/no-sibling-hooks': 'error',
		'mocha/no-top-level-hooks': 'error'
	}
};
