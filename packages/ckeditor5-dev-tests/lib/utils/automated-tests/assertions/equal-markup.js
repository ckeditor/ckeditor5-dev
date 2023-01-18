/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const AssertionError = require( 'assertion-error' );
const { html_beautify: beautify } = require( 'js-beautify/js/lib/beautify-html' );

/**
 * Factory function that registers the `equalMarkup` assertion.
 *
 * @param {Chai} chai
 */
module.exports = chai => {
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
	 * @param {String} expected Markup to compare.
	 */
	chai.Assertion.addMethod( 'equalMarkup', function( expected ) {
		const actual = this._obj;
		const message = 'Expected markup strings to be equal';

		if ( actual !== expected ) {
			throw new AssertionError( message, {
				actual: formatMarkup( actual ),
				expected: formatMarkup( expected ),
				showDiff: true
			} );
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
