/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import addTranslation from '../../lib/utils/addtranslation.js';

describe( 'addTranslation()', () => {
	let singularMessage, pluralMessage;

	beforeEach( () => {
		singularMessage = {
			string: 'Example message 1'
		};

		pluralMessage = {
			string: 'Example message 2',
			plural: 'Example message 2 - plural form'
		};
	} );

	it( 'should be a function', () => {
		expect( addTranslation ).toBeInstanceOf( Function );
	} );

	it( 'should return translation (English, non-plural message)', () => {
		const result = addTranslation( { languageCode: 'en', numberOfPluralForms: 2, message: singularMessage } );

		expect( result ).toEqual( [ 'Example message 1' ] );
	} );

	it( 'should return translation (English, plural message)', () => {
		const result = addTranslation( { languageCode: 'en', numberOfPluralForms: 2, message: pluralMessage } );

		expect( result ).toEqual( [ 'Example message 2', 'Example message 2 - plural form' ] );
	} );

	it( 'should return translation (non-English, non-plural message)', () => {
		const result = addTranslation( { languageCode: 'pl', numberOfPluralForms: 4, message: singularMessage } );

		expect( result ).toEqual( [ '' ] );
	} );

	it( 'should return translation (non-English, plural message)', () => {
		const result = addTranslation( { languageCode: 'pl', numberOfPluralForms: 4, message: pluralMessage } );

		expect( result ).toEqual( [ '', '', '', '' ] );
	} );
} );
