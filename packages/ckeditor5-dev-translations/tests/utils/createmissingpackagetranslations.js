/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import PO from 'pofile';
import cleanTranslationFileContent from '../../lib/utils/cleantranslationfilecontent.js';
import getLanguages from '../../lib/utils/getlanguages.js';
import getHeaders from '../../lib/utils/getheaders.js';
import createMissingPackageTranslations from '../../lib/utils/createmissingpackagetranslations.js';

vi.mock( 'fs' );
vi.mock( 'pofile' );
vi.mock( '../../lib/utils/cleantranslationfilecontent.js' );
vi.mock( '../../lib/utils/getlanguages.js' );
vi.mock( '../../lib/utils/getheaders.js' );

describe( 'createMissingPackageTranslations()', () => {
	let translations, defaultOptions;

	beforeEach( () => {
		translations = {
			headers: {}
		};

		defaultOptions = {
			packagePath: '/absolute/path/to/packages/ckeditor5-foo',
			skipLicenseHeader: false
		};

		vi.mocked( PO.parse ).mockReturnValue( translations );

		vi.mocked( getLanguages ).mockReturnValue( [
			{ localeCode: 'en', languageCode: 'en', languageFileName: 'en' },
			{ localeCode: 'zh_TW', languageCode: 'zh', languageFileName: 'zh-tw' }
		] );

		vi.mocked( getHeaders ).mockImplementation( ( languageCode, localeCode ) => {
			return {
				Language: localeCode,
				'Plural-Forms': 'nplurals=4; plural=example plural formula;',
				'Content-Type': 'text/plain; charset=UTF-8'
			};
		} );

		vi.mocked( cleanTranslationFileContent ).mockReturnValue( {
			toString: () => 'Clean PO file content.'
		} );

		vi.mocked( fs.existsSync ).mockImplementation( path => {
			if ( path === '/absolute/path/to/packages/ckeditor5-foo/lang/translations/en.po' ) {
				return true;
			}

			return false;
		} );

		vi.mocked( fs.readFileSync ).mockReturnValue( [
			`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.`,
			'',
			'# Example translation file header.',
			''
		].join( '\n' ) );
	} );

	it( 'should be a function', () => {
		expect( createMissingPackageTranslations ).toBeInstanceOf( Function );
	} );

	it( 'should check if translation files exist for each language', () => {
		createMissingPackageTranslations( defaultOptions );

		expect( fs.existsSync ).toHaveBeenCalledTimes( 2 );
		expect( fs.existsSync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-foo/lang/translations/en.po' );
		expect( fs.existsSync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-foo/lang/translations/zh-tw.po' );
	} );

	it( 'should create missing translation files from the template', () => {
		createMissingPackageTranslations( defaultOptions );

		expect( fs.readFileSync ).toHaveBeenCalledTimes( 1 );
		expect( fs.readFileSync ).toHaveBeenCalledWith(
			expect.stringMatching( 'ckeditor5-dev-translations/lib/templates/translation.po' ),
			'utf-8'
		);

		expect( getHeaders ).toHaveBeenCalledWith( 'zh', 'zh_TW' );

		expect( translations.headers.Language ).toEqual( 'zh_TW' );
		expect( translations.headers[ 'Plural-Forms' ] ).toEqual( 'nplurals=4; plural=example plural formula;' );
		expect( translations.headers[ 'Content-Type' ] ).toEqual( 'text/plain; charset=UTF-8' );
	} );

	it( 'should not read the template if `skipLicenseHeader` flag is set', () => {
		defaultOptions.skipLicenseHeader = true;

		createMissingPackageTranslations( defaultOptions );

		expect( fs.readFileSync ).not.toHaveBeenCalled();
	} );

	it( 'should save missing translation files on filesystem after cleaning the content', () => {
		createMissingPackageTranslations( defaultOptions );

		expect( cleanTranslationFileContent ).toHaveBeenCalledTimes( 1 );

		expect( fs.writeFileSync ).toHaveBeenCalledTimes( 1 );
		expect( fs.writeFileSync ).toHaveBeenCalledWith(
			'/absolute/path/to/packages/ckeditor5-foo/lang/translations/zh-tw.po',
			'Clean PO file content.',
			'utf-8'
		);
	} );
} );
