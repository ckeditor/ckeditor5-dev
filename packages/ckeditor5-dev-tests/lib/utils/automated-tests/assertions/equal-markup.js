/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { AssertionError } from 'assertion-error';
import { html_beautify as beautify } from 'js-beautify';

/**
 * Factory function that registers the `equalMarkup` assertion.
 *
 * @param {Chai} chai
 */
export default chai => {
	/**
	 * Custom assertion that tests whether two given strings containing markup language are equal.
	 * Unlike `expect().to.equal()` form Chai assertion library, this assertion formats the markup before showing a diff.
	 *
	 * This assertion can be used to test HTML strings and string containing serialized model.
	 *
	 *		// Will throw an assertion error.
	 *		expect(
	 *			'<paragraph>foo bXXX[]r baz</paragraph>'
	 *		).to.equalMarkup(
	 *			'<paragraph>foo bYYY[]r baz</paragraph>'
	 *		);
	 *
	 * Please note that if the difference in the markup concerns only whitespace characters inside tags (e.g. between attributes),
	 * a diff between unformatted (rather than formatted) strings is displayed.
	 *
	 *		// Will throw an assertion error, but without formatting the markup.
	 *		expect(
	 *			'<paragraph>[]foo</paragraph><paragraph>bar</paragraph>'
	 *		).to.equalMarkup(
	 *			'<paragraph>[]foo</paragraph><paragraph>bar</paragraph >'
	 *		);
	 *
	 * @param {string} expected Markup to compare.
	 */
	chai.Assertion.addMethod( 'equalMarkup', function( expected ) {
		const actual = this._obj;
		const message = 'Expected markup strings to be equal';

		if ( actual !== expected ) {
			const actualFormatted = formatMarkup( actual );
			const expectedFormatted = formatMarkup( expected );
			const areFormattedStringsEqual = actualFormatted === expectedFormatted;

			// HTML beautification tool removes all redundant whitespace characters inside tags and this behavior cannot be configured.
			// Therefore, if there is no difference between formatted strings, but we know they are different, display raw (unformatted)
			// strings instead.
			const data = {
				actual: areFormattedStringsEqual ? actual : actualFormatted,
				expected: areFormattedStringsEqual ? expected : expectedFormatted,
				showDiff: true
			};

			throw new AssertionError( message, data );
		}
	} );
};

// Renames the $text occurrences as it is not properly formatted by the beautifier - it is tread as a block.
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
