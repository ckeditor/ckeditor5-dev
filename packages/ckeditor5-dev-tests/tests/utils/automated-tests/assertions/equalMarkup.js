/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

const chai = require( 'chai' );

// require( '../../../../lib/utils/automated-tests/assertions/equalMarkup' );

const markupA = '<paragraph>foo bXXX[]r baz</paragraph>';
const markupB = '<paragraph>foo bYYY[]r baz</paragraph>';

describe( 'equalMarkup chai assertion', () => {
	it( 'should be added to chai assertions', () => {
		const assertion = new chai.Assertion();

		chai.expect( assertion ).to.have.property( 'equalMarkup' );
		chai.expect( assertion.equalMarkup ).to.be.instanceof( Function );
	} );

	it( 'should pass for equal markups', () => {
		chai.expect( function() {
			chai.expect( markupA ).to.equalMarkup( markupA );
		} ).to.not.throw();
	} );

	it( 'should not pass for unequal markups', () => {
		chai.expect( function() {
			chai.expect( markupA ).to.equalMarkup( markupB );
		} ).to.throw( 'Expected markup strings to be equal' );
	} );
} );

/*
import AssertionError from 'assertion-error';

describe( 'assertEqualMarkup()', () => {
	it( 'should not throw for equal strings', () => {
		expect( assertEqualMarkup( 'foo', 'foo' ) ).to.not.throw;
	} );

	it( 'should throw AssertionError for not equal strings', () => {
		try {
			assertEqualMarkup( 'foo', 'bar' );
		} catch ( assertionError ) {
			expect( assertionError ).to.be.instanceOf( AssertionError );
		}
	} );

	it( 'should throw with default (short) message', () => {
		try {
			assertEqualMarkup( 'foo', 'bar' );
		} catch ( assertionError ) {
			expect( assertionError.message ).to.equal( 'Expected markup strings to be equal' );
		}
	} );

	it( 'should throw with passed message', () => {
		try {
			assertEqualMarkup( 'foo', 'bar', 'baz' );
		} catch ( assertionError ) {
			expect( assertionError.message ).to.equal( 'baz' );
		}
	} );

	it( 'should format actual string', () => {
		try {
			assertEqualMarkup( '<div><p><span>foo</span></p></div>', 'bar' );
		} catch ( assertionError ) {
			expect( assertionError.actual ).to.equal(
				'<div>\n' +
				'  <p><span>foo</span></p>\n' +
				'</div>'
			);
		}
	} );

	it( 'should format expected string', () => {
		try {
			assertEqualMarkup( 'foo', '<div><p><span>foo</span></p></div>' );
		} catch ( assertionError ) {
			expect( assertionError.expected ).to.equal(
				'<div>\n' +
				'  <p><span>foo</span></p>\n' +
				'</div>'
			);
		}
	} );

	it( 'should format model text node with attributes as inline', () => {
		try {
			assertEqualMarkup( 'foo', '<paragraph><$text bold="true">foo</$text></paragraph>' );
		} catch ( assertionError ) {
			expect( assertionError.expected ).to.equal(
				'<paragraph><$text bold="true">foo</$text></paragraph>'
			);
		}
	} );

	it( 'should format nested model structure properly', () => {
		try {
			assertEqualMarkup( 'foo',
				'<blockQuote>' +
					'<table>' +
						'<tableRow>' +
							'<tableCell>' +
								'<paragraph><$text bold="true">foo</$text></paragraph>' +
							'</tableCell>' +
							'<tableCell>' +
								'<paragraph><$text bold="true">bar</$text></paragraph>' +
								'<paragraph><$text bold="true">baz</$text></paragraph>' +
							'</tableCell>' +
						'</tableRow>' +
					'</table>' +
				'</blockQuote>'
			);
		} catch ( assertionError ) {
			expect( assertionError.expected ).to.equal(
				'<blockQuote>\n' +
				'  <table>\n' +
				'    <tableRow>\n' +
				'      <tableCell>\n' +
				'        <paragraph><$text bold="true">foo</$text></paragraph>\n' +
				'      </tableCell>\n' +
				'      <tableCell>\n' +
				'        <paragraph><$text bold="true">bar</$text></paragraph>\n' +
				'        <paragraph><$text bold="true">baz</$text></paragraph>\n' +
				'      </tableCell>\n' +
				'    </tableRow>\n' +
				'  </table>\n' +
				'</blockQuote>'
			);
		}
	} );
} );
*/
