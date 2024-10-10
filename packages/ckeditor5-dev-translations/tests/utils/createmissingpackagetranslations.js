/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import PO from 'pofile';
import { getNPlurals, getFormula } from 'plural-forms';
import cleanPoFileContent from '../../lib/cleanpofilecontent.js';
import getLanguages from '../../lib/utils/getlanguages.js';
import createMissingPackageTranslations from '../../lib/utils/createmissingpackagetranslations.js';

vi.mock( 'fs-extra' );
vi.mock( 'pofile' );
vi.mock( 'plural-forms' );
vi.mock( '../../lib/cleanpofilecontent.js' );
vi.mock( '../../lib/utils/getlanguages.js' );

describe( 'createMissingPackageTranslations()', () => {
	let translations;

	beforeEach( () => {
		translations = {
			headers: {},
			toString: () => 'Raw PO file content.'
		};

		vi.mocked( PO.parse ).mockReturnValue( translations );

		vi.mocked( getNPlurals ).mockReturnValue( 4 );
		vi.mocked( getFormula ).mockReturnValue( 'example plural formula' );

		vi.mocked( getLanguages ).mockReturnValue( [
			{ localeCode: 'en', languageCode: 'en', languageFileName: 'en' },
			{ localeCode: 'zh_TW', languageCode: 'zh', languageFileName: 'zh-tw' }
		] );

		vi.mocked( cleanPoFileContent ).mockReturnValue( 'Clean PO file content.' );

		vi.mocked( fs.existsSync ).mockImplementation( path => {
			if ( path === 'packages/ckeditor5-foo/lang/translations/en.po' ) {
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
		createMissingPackageTranslations( { packagePath: 'packages/ckeditor5-foo' } );

		expect( fs.existsSync ).toHaveBeenCalledTimes( 2 );
		expect( fs.existsSync ).toHaveBeenCalledWith( 'packages/ckeditor5-foo/lang/translations/en.po' );
		expect( fs.existsSync ).toHaveBeenCalledWith( 'packages/ckeditor5-foo/lang/translations/zh-tw.po' );
	} );

	it( 'should create missing translation files from the template', () => {
		createMissingPackageTranslations( { packagePath: 'packages/ckeditor5-foo' } );

		expect( fs.readFileSync ).toHaveBeenCalledTimes( 1 );
		expect( fs.readFileSync ).toHaveBeenCalledWith(
			expect.stringMatching( 'ckeditor5-dev/packages/ckeditor5-dev-translations/lib/templates/translation.po' ),
			'utf-8'
		);

		expect( getNPlurals ).toHaveBeenCalledWith( 'zh' );
		expect( getFormula ).toHaveBeenCalledWith( 'zh' );

		expect( translations.headers.Language ).toEqual( 'zh_TW' );
		expect( translations.headers[ 'Plural-Forms' ] ).toEqual( 'nplurals=4; plural=example plural formula;' );
	} );

	it( 'should save missing translation files on filesystem after cleaning the content', () => {
		createMissingPackageTranslations( { packagePath: 'packages/ckeditor5-foo' } );

		expect( cleanPoFileContent ).toHaveBeenCalledTimes( 1 );
		expect( cleanPoFileContent ).toHaveBeenCalledWith( 'Raw PO file content.' );

		expect( fs.writeFileSync ).toHaveBeenCalledTimes( 1 );
		expect( fs.writeFileSync ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/lang/translations/zh-tw.po',
			'Clean PO file content.',
			'utf-8'
		);
	} );
} );
