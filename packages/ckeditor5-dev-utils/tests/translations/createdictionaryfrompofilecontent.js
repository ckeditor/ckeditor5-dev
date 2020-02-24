/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const createDicitionaryFromPoFileContent = require( '../../lib/translations/createdictionaryfrompofilecontent' );

describe( 'translations', () => {
	describe( 'parsePoFileContent()', () => {
		// More functional rather than unit test to check whole conversion process.
		it( 'should parse content and return js object with key - value pairs', () => {
			const result = createDicitionaryFromPoFileContent( [
				'msgctxt "Toolbar"',
				'msgid "Save"',
				'msgstr "Zapisz"',
				'',
				'msgctxt "Toolbar"',
				'msgid "Cancel"',
				'msgstr "Anuluj"',
				''
			].join( '\n' ) );

			expect( result ).to.deep.equal( {
				'toolbar|save': 'Zapisz',
				'toolbar|cancel': 'Anuluj'
			} );
		} );

		it( 'should skip the objects that do not contain msgstr property', () => {
			const result = createDicitionaryFromPoFileContent( [
				'msgctxt "Toolbar"',
				'msgid "Save"',
				'msgstr ""',
				'',
			].join( '\n' ) );

			expect( result ).to.deep.equal( {} );
		} );
	} );
} );
