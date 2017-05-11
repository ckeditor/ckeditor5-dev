/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	'extends': 'eslint:recommended',
	'parserOptions': {
		'ecmaVersion': 6,
		'sourceType': 'script'
	},
	'env': {
		'es6': true,
		'node': true,
		'mocha': true
	},
	'globals': {
		'expect': true,
		'sinon': true
	},
	'rules': {
		// Possible errors.
		'no-extra-parens': 'error',

		// Best practices.
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
		'no-invalid-this': 'error',
		'no-labels': 'error',
		'no-lone-blocks': 'error',
		'no-loop-func': 'error',
		'no-multi-spaces': 'error',
		'no-multi-str': 'error',
		'no-new': 'error',
		'no-new-func': 'error',
		'no-new-wrappers': 'error',
		'no-param-reassign': 'error',
		'no-return-assign': 'error',
		'no-self-compare': 'error',
		'no-sequences': 'error',
		'no-unused-expressions': 'error',
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

		// Variables.
		'no-undefined': 'error',
		'no-use-before-define': [
			'error',
			{
				functions: false,
				classes: false,
				variables: true
			}
		],

		// Stylistic issues.
		'array-bracket-spacing': [
			'error',
			'always'
		],
		'block-spacing': [
			'error',
			'always'
		],
		'brace-style': [
			'error',
			'1tbs'
		],
		'camelcase': [
			'error',
			{
				'properties': 'never'
			}
		],
		'comma-dangle': [
			'error',
			'never'
		],
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
		'line-comment-position': [
			'error',
			{
				position: 'above'
			}
		],
		'linebreak-style': [
			'error',
			'unix'
		],
		'lines-around-comment': [
			'error',
			{
				beforeBlockComment: true
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
				uninitialized: 'always',
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
			'consistent-as-needed'
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
			'never'
		],
		'space-infix-ops': 'error',
		'space-in-parens': [
			'error',
			'always'
		],
		'space-unary-ops': [
			'error',
			{
				words: false,
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

		// ECMAScript 6.
		'arrow-body-style': [
			'error',
			'as-needed'
		],
		'arrow-parens': [
			'error',
			'as-needed'
		],
		'arrow-spacing': 'error',
		'no-confusing-arrow': 'error',
		'generator-star-spacing': 'error',
		'no-duplicate-imports': 'error',
		'no-useless-computed-key': 'error',
		'no-useless-constructor': 'error',
		'no-var': 'error',
		'object-shorthand': 'error',
		'prefer-const': 'error',
		'prefer-rest-params': 'error',
		'prefer-spread': 'error',
		'symbol-description': 'error',
		'template-curly-spacing': [
			'error',
			'always'
		],
		'yield-star-spacing': 'error'
	}
};
