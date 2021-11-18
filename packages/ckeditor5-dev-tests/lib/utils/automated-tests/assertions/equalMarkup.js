/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* global chai */

import AssertionError from 'assertion-error';
import { html_beautify as beautify } from 'js-beautify/js/lib/beautify-html';

/**
 * An assertion util test whether two given strings containing markup language are equal.
 * Unlike `expect().to.equal()` form Chai assertion library, this util formats the markup before showing a diff.
 *
 * This util can be used to test HTML strings and string containing serialized model.
 *
 *		// Will throw an error that is handled as assertion error by Chai.
 *		assertEqualMarkup(
 *			'<paragraph><$text foo="bar">baz</$text></paragraph>',
 *			'<paragraph><$text foo="bar">baaz</$text></paragraph>',
 *		);
 *
 * @param {String} expected Markup to compare.
 */
chai.Assertion.addMethod( 'equalMarkup', function( expected ) {
	const actual = this._obj;
	const message = 'Expected markup strings to be equal';

	if ( actual != expected ) {
		throw new AssertionError( message, {
			actual: formatMarkup( actual ),
			expected: formatMarkup( expected ),
			showDiff: true
		} );
	}
} );

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
