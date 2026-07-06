/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { html_beautify as beautify } from 'js-beautify';

/**
 * Custom matcher that tests whether two given strings containing markup language are equal.
 * Unlike `expect().toEqual()`, this matcher formats the markup before showing a diff.
 *
 * It can be used to test HTML strings and strings containing a serialized model.
 *
 * To register the matcher, use the `expect.extend()` API in a Vitest setup file:
 *
 *		import { expect } from 'vitest';
 *		import { markupMatchers } from '@ckeditor/ckeditor5-dev-tests/lib/vitest/matchers.js';
 *
 *		expect.extend( markupMatchers );
 *
 * Then, in tests:
 *
 *		// Will fail with a diff of formatted markup strings.
 *		expect(
 *			'<paragraph>foo bXXX[]r baz</paragraph>'
 *		).toEqualMarkup(
 *			'<paragraph>foo bYYY[]r baz</paragraph>'
 *		);
 *
 * Please note that if the difference in the markup concerns only whitespace characters inside tags (e.g. between attributes),
 * a diff between unformatted (rather than formatted) strings is displayed.
 *
 * @param {string} received Markup to compare.
 * @param {string} expected Markup to compare.
 * @returns {object} The matcher result.
 */
export function toEqualMarkup( received, expected ) {
	if ( received === expected ) {
		return {
			pass: true,
			message: () => 'Expected markup strings not to be equal'
		};
	}

	const receivedFormatted = formatMarkup( received );
	const expectedFormatted = formatMarkup( expected );

	// HTML beautification tool removes all redundant whitespace characters inside tags and this behavior cannot be configured.
	// Therefore, if there is no difference between formatted strings, but we know they are different, display raw (unformatted)
	// strings instead.
	const areFormattedStringsEqual = receivedFormatted === expectedFormatted;

	return {
		pass: false,
		message: () => 'Expected markup strings to be equal',
		actual: areFormattedStringsEqual ? received : receivedFormatted,
		expected: areFormattedStringsEqual ? expected : expectedFormatted
	};
}

/**
 * An object with all matchers defined in this module, ready to be passed to the `expect.extend()` API.
 */
export const markupMatchers = { toEqualMarkup };

// Renames the $text occurrences as it is not properly formatted by the beautifier - it is treated as a block.
const TEXT_TAG_PLACEHOLDER = 'span data-cke="true"';
const TEXT_TAG_PLACEHOLDER_REGEXP = new RegExp( TEXT_TAG_PLACEHOLDER, 'g' );

function formatMarkup( string ) {
	const htmlSafeString = string.replace( /\$text/g, TEXT_TAG_PLACEHOLDER );

	const beautifiedMarkup = beautify( htmlSafeString, {
		indent_size: 2,
		space_in_empty_paren: true
	} );

	return beautifiedMarkup.replace( TEXT_TAG_PLACEHOLDER_REGEXP, '$text' );
}
