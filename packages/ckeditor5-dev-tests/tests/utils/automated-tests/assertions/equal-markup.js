/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeAll, describe, expect, it, chai } from 'vitest';
import equalMarkupFactory from '../../../../lib/utils/automated-tests/assertions/equal-markup.js';

describe( 'equalMarkup chai assertion', () => {
	beforeAll( () => {
		equalMarkupFactory( chai );
	} );

	it( 'should be added to chai assertions', () => {
		const assertion = new chai.Assertion();

		expect( assertion ).to.have.property( 'equalMarkup' );
		expect( assertion.equalMarkup ).to.be.instanceof( Function );
	} );

	it( 'should not throw for equal markups', () => {
		expect( function() {
			expect(
				'<paragraph>foo bXXX[]r baz</paragraph>'
			).to.equalMarkup(
				'<paragraph>foo bXXX[]r baz</paragraph>'
			);
		} ).to.not.throw();
	} );

	it( 'should throw AssertionError for unequal markups', () => {
		expect( function() {
			expect(
				'<paragraph>foo bXXX[]r baz</paragraph>'
			).to.equalMarkup(
				'<paragraph>foo bYYY[]r baz</paragraph>'
			);
		} ).to.throw( 'Expected markup strings to be equal' );
	} );

	it( 'should format the actual markup', () => {
		try {
			expect(
				'<div><p><span>foo</span></p></div>'
			).to.equalMarkup(
				'bar'
			);
		} catch ( assertionError ) {
			expect( assertionError.actual ).to.equal(
				'<div>\n' +
				'  <p><span>foo</span></p>\n' +
				'</div>'
			);
		}
	} );

	it( 'should format the expected markup', () => {
		try {
			expect(
				'foo'
			).to.equalMarkup(
				'<div><p><span>foo</span></p></div>'
			);
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
			expect(
				'foo'
			).to.equalMarkup(
				'<paragraph><$text bold="true">foo</$text></paragraph>'
			);
		} catch ( assertionError ) {
			expect( assertionError.expected ).to.equal(
				'<paragraph><$text bold="true">foo</$text></paragraph>'
			);
		}
	} );

	it( 'should format nested model structure properly', () => {
		try {
			expect(
				'foo'
			).to.equalMarkup(
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

	it( 'should not format strings if beautifier returns equal markups after formatting', () => {
		try {
			expect(
				'<div><p><span>foo</span></p></div>'
			).to.equalMarkup(
				'<div><p><span>foo</span></p></div >'
			);
		} catch ( assertionError ) {
			expect( assertionError.actual ).to.equal( '<div><p><span>foo</span></p></div>' );
			expect( assertionError.expected ).to.equal( '<div><p><span>foo</span></p></div >' );
		}
	} );
} );
