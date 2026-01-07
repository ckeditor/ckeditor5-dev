/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import getLanguages from '../../lib/utils/getlanguages.js';

describe( 'getLanguages()', () => {
	it( 'should be a function', () => {
		expect( getLanguages ).toBeInstanceOf( Function );
	} );

	it( 'should return an array of languages', () => {
		const languages = getLanguages();

		expect( languages ).toBeInstanceOf( Array );
		expect( languages[ 0 ] ).toEqual( expect.objectContaining( {
			localeCode: expect.any( String ),
			languageCode: expect.any( String ),
			languageFileName: expect.any( String )
		} ) );
	} );

	it( 'should return Polish language', () => {
		const languages = getLanguages();
		const languagePolish = languages.find( item => item.localeCode === 'pl' );

		expect( languagePolish ).toEqual( {
			localeCode: 'pl',
			languageCode: 'pl',
			languageFileName: 'pl'
		} );
	} );

	it( 'should return Belarusian language', () => {
		const languages = getLanguages();
		const languagePolish = languages.find( item => item.localeCode === 'be' );

		expect( languagePolish ).toEqual( {
			localeCode: 'be',
			languageCode: 'be',
			languageFileName: 'be'
		} );
	} );

	it( 'should normalize language if it contains special characters', () => {
		const languages = getLanguages();
		const languageSerbianLatin = languages.find( l => l.localeCode === 'sr@latin' );

		expect( languageSerbianLatin ).toEqual( {
			localeCode: 'sr@latin',
			languageCode: 'sr',
			languageFileName: 'sr-latn'
		} );
	} );

	it( 'should use predefined filename if defined', () => {
		const languages = getLanguages();
		const languageChineseTaiwan = languages.find( l => l.localeCode === 'zh_TW' );

		expect( languageChineseTaiwan ).toEqual( {
			localeCode: 'zh_TW',
			languageCode: 'zh',
			languageFileName: 'zh'
		} );
	} );
} );
