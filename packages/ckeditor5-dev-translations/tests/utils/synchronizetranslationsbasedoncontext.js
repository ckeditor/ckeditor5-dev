/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import PO from 'pofile';
import { glob } from 'glob';
import cleanTranslationFileContent from '../../lib/utils/cleantranslationfilecontent.js';
import createMissingPackageTranslations from '../../lib/utils/createmissingpackagetranslations.js';
import getLanguages from '../../lib/utils/getlanguages.js';
import getHeaders from '../../lib/utils/getheaders.js';
import addTranslation from '../../lib/utils/addtranslation.js';
import synchronizeTranslationsBasedOnContext from '../../lib/utils/synchronizetranslationsbasedoncontext.js';

vi.mock( 'fs' );
vi.mock( 'pofile' );
vi.mock( 'glob' );
vi.mock( '../../lib/utils/createmissingpackagetranslations.js' );
vi.mock( '../../lib/utils/cleantranslationfilecontent.js' );
vi.mock( '../../lib/utils/getlanguages.js' );
vi.mock( '../../lib/utils/getheaders.js' );
vi.mock( '../../lib/utils/addtranslation.js' );

describe( 'synchronizeTranslationsBasedOnContext()', () => {
	let defaultOptions, translations, stubs;

	beforeEach( () => {
		defaultOptions = {
			packageContexts: [
				{
					packagePath: '/absolute/path/to/packages/ckeditor5-foo',
					contextContent: {
						id1: 'Context for example message 1',
						id2: 'Context for example message 2'
					}
				}
			],
			sourceMessages: [
				{
					id: 'id1',
					string: 'Example message 1'
				},
				{
					id: 'id2',
					string: 'Example message 2',
					plural: 'Example message 2 - plural form'
				}
			],
			skipLicenseHeader: false
		};

		translations = {
			headers: {
				Language: 'en'
			},
			items: [
				{ msgid: 'id1' },
				{ msgid: 'id2' }
			],
			toString: () => 'Raw PO file content.'
		};

		stubs = {
			poItemConstructor: vi.fn()
		};

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

		vi.mocked( addTranslation ).mockReturnValue( [] );

		vi.mocked( PO.parse ).mockReturnValue( translations );

		vi.mocked( PO.parsePluralForms ).mockReturnValue( { nplurals: 4 } );

		vi.mocked( PO.Item ).mockImplementation( () => new class {
			constructor( ...args ) {
				stubs.poItemConstructor( ...args );

				this.msgid = '';
				this.msgctxt = '';
				this.msgstr = [];
				this.msgid_plural = '';
			}
		}() );

		vi.mocked( glob.sync ).mockImplementation( pattern => [ pattern.replace( '*', 'en' ) ] );

		vi.mocked( fs.readFileSync ).mockReturnValue( 'Raw PO file content.' );

		vi.mocked( cleanTranslationFileContent ).mockReturnValue( {
			toString: () => 'Clean PO file content.'
		} );
	} );

	it( 'should be a function', () => {
		expect( synchronizeTranslationsBasedOnContext ).toBeInstanceOf( Function );
	} );

	it( 'should create missing translations', () => {
		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( createMissingPackageTranslations ).toHaveBeenCalledTimes( 1 );
		expect( createMissingPackageTranslations ).toHaveBeenCalledWith( {
			packagePath: '/absolute/path/to/packages/ckeditor5-foo',
			skipLicenseHeader: false
		} );
	} );

	it( 'should create missing translations with skipping the license header', () => {
		defaultOptions.skipLicenseHeader = true;

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( createMissingPackageTranslations ).toHaveBeenCalledTimes( 1 );
		expect( createMissingPackageTranslations ).toHaveBeenCalledWith( {
			packagePath: '/absolute/path/to/packages/ckeditor5-foo',
			skipLicenseHeader: true
		} );
	} );

	it( 'should not update any files when package does not contain translation context', () => {
		defaultOptions.packageContexts = [
			{
				packagePath: '/absolute/path/to/packages/ckeditor5-foo',
				contextContent: {}
			}
		];

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( createMissingPackageTranslations ).not.toHaveBeenCalled();
		expect( fs.writeFileSync ).not.toHaveBeenCalled();
	} );

	it( 'should search for translation files', () => {
		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( glob.sync ).toHaveBeenCalledTimes( 1 );
		expect( glob.sync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-foo/lang/translations/*.po' );
	} );

	it( 'should parse each translation file', () => {
		vi.mocked( glob.sync ).mockImplementation( pattern => {
			return [ 'en', 'zh-tw' ].map( language => pattern.replace( '*', language ) );
		} );

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( fs.readFileSync ).toHaveBeenCalledTimes( 2 );
		expect( fs.readFileSync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-foo/lang/translations/en.po', 'utf-8' );
		expect( fs.readFileSync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-foo/lang/translations/zh-tw.po', 'utf-8' );
	} );

	it( 'should update file header', () => {
		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( translations.headers ).toEqual( {
			Language: 'en',
			'Plural-Forms': 'nplurals=4; plural=example plural formula;',
			'Content-Type': 'text/plain; charset=UTF-8'
		} );
	} );

	it( 'should remove unused translations', () => {
		translations.items.push(
			{ msgid: 'id3' },
			{ msgid: 'id4' }
		);

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( translations.items ).toEqual( [
			{ msgid: 'id1' },
			{ msgid: 'id2' }
		] );
	} );

	it( 'should add missing translations', () => {
		vi.mocked( addTranslation ).mockReturnValue( [ 'added missing translation' ] );
		translations.items = [];

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( addTranslation ).toHaveBeenCalledTimes( 2 );

		expect( addTranslation ).toHaveBeenCalledWith( {
			languageCode: 'en',
			message: {
				id: 'id1',
				string: 'Example message 1'
			},
			numberOfPluralForms: 4
		} );

		expect( addTranslation ).toHaveBeenCalledWith( {
			languageCode: 'en',
			message: {
				id: 'id2',
				plural: 'Example message 2 - plural form',
				string: 'Example message 2'
			},
			numberOfPluralForms: 4
		} );

		expect( translations.items ).toEqual( [
			{
				msgid: 'id1',
				msgctxt: 'Context for example message 1',
				msgid_plural: '',
				msgstr: expect.arrayContaining( [ 'added missing translation' ] )
			},
			{
				msgid: 'id2',
				msgctxt: 'Context for example message 2',
				msgid_plural: 'Example message 2 - plural form',
				msgstr: expect.arrayContaining( [ 'added missing translation' ] )
			}
		] );
	} );

	it( 'should remove existing plural forms if a source file contains more than a language defines', () => {
		translations.items = [
			{
				msgid: 'id1',
				msgctxt: 'Context for example message 1',
				msgid_plural: '',
				msgstr: [ '' ]
			},
			{
				msgid: 'id2',
				msgctxt: 'Context for example message 2',
				msgid_plural: 'Example message 2 - plural form',
				msgstr: [ '1', '2', '3', '4', '5', '6' ]
			}
		];

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( translations.items ).toEqual( [
			// `id1` is not updated as it does not offer plural forms.
			{
				msgid: 'id1',
				msgctxt: 'Context for example message 1',
				msgid_plural: '',
				msgstr: [ '' ]
			},
			{
				msgid: 'id2',
				msgctxt: 'Context for example message 2',
				msgid_plural: 'Example message 2 - plural form',
				msgstr: [ '1', '2', '3', '4' ]
			}
		] );
	} );

	it( 'should add empty plural forms if a source file contains less than a language defines', () => {
		translations.items = [
			{
				msgid: 'id1',
				msgctxt: 'Context for example message 1',
				msgid_plural: '',
				msgstr: [ '' ]
			},
			{
				msgid: 'id2',
				msgctxt: 'Context for example message 2',
				msgid_plural: 'Example message 2 - plural form',
				msgstr: [ '1', '2' ]
			}
		];

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( translations.items ).toEqual( [
			// `id1` is not updated as it does not offer plural forms.
			{
				msgid: 'id1',
				msgctxt: 'Context for example message 1',
				msgid_plural: '',
				msgstr: [ '' ]
			},
			{
				msgid: 'id2',
				msgctxt: 'Context for example message 2',
				msgid_plural: 'Example message 2 - plural form',
				msgstr: [ '1', '2', '', '' ]
			}
		] );
	} );

	it( 'should save updated translation files on filesystem after cleaning the content', () => {
		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( cleanTranslationFileContent ).toHaveBeenCalledTimes( 1 );

		expect( fs.writeFileSync ).toHaveBeenCalledTimes( 1 );
		expect( fs.writeFileSync ).toHaveBeenCalledWith(
			'/absolute/path/to/packages/ckeditor5-foo/lang/translations/en.po',
			'Clean PO file content.',
			'utf-8'
		);
	} );

	it( 'should not save translation files on filesystem if their content is not updated', () => {
		vi.mocked( cleanTranslationFileContent ).mockImplementation( input => input );

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( fs.writeFileSync ).not.toHaveBeenCalled();
	} );
} );
