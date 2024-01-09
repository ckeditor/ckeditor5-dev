/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const createDictionaryFromPoFileContent = require( '../lib/createdictionaryfrompofilecontent' );

describe( 'translations', () => {
	describe( 'parsePoFileContent()', () => {
		// More functional rather than unit test to check whole conversion process.
		it( 'should parse content and return js object with key - value pairs', () => {
			const result = createDictionaryFromPoFileContent( [
				'msgctxt "Label for the Save button."',
				'msgid "Save"',
				'msgstr "Zapisz"',
				'',
				'msgctxt "Label for the Cancel button."',
				'msgid "Cancel"',
				'msgstr "Anuluj"',
				''
			].join( '\n' ) );

			expect( result ).to.deep.equal( {
				Save: [ 'Zapisz' ],
				Cancel: [ 'Anuluj' ]
			} );
		} );

		it( 'should skip the objects that do not contain msgstr property', () => {
			const result = createDictionaryFromPoFileContent( [
				'msgctxt "Label for the Save button."',
				'msgid "Save"',
				'msgstr ""',
				''
			].join( '\n' ) );

			expect( result ).to.deep.equal( {} );
		} );
	} );
} );
