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
	let languages, defaultOptions, enTranslations, zhTranslations, stubs;

	beforeEach( () => {
		languages = [
			{ localeCode: 'en', languageCode: 'en', languageFileName: 'en' },
			{ localeCode: 'zh_TW', languageCode: 'zh', languageFileName: 'zh-tw' }
		];

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

		enTranslations = {
			headers: {
				Language: 'en'
			},
			items: [
				{
					msgid: 'id1',
					msgctxt: 'Context for example message 1',
					msgstr: [ 'Example message 1' ]
				},
				{
					msgid: 'id2',
					msgctxt: 'Context for example message 2',
					msgstr: [ 'Example message 2', 'Example message 2 - plural form' ],
					msgid_plural: 'Example message 2 - plural form'
				}
			],
			toString: () => 'Raw PO file content in en.'
		};

		zhTranslations = {
			headers: {
				Language: 'zh_TW'
			},
			items: [
				{
					msgid: 'id1',
					msgctxt: 'Context for example message 1',
					msgstr: [ 'Example message 1 in zh_TW' ]
				},
				{
					msgid: 'id2',
					msgctxt: 'Context for example message 2',
					msgstr: [ 'Example message 2 in zh_TW', 'Example message 2 - plural form in zh_TW' ],
					msgid_plural: 'Example message 2 - plural form in zh_TW'
				}
			],
			toString: () => 'Raw PO file content in zh_TW.'
		};

		stubs = {
			poItemConstructor: vi.fn()
		};

		vi.mocked( getLanguages ).mockReturnValue( languages );

		vi.mocked( getHeaders ).mockImplementation( ( languageCode, localeCode ) => {
			return {
				Language: localeCode,
				'Plural-Forms': 'nplurals=4; plural=example plural formula;',
				'Content-Type': 'text/plain; charset=UTF-8'
			};
		} );

		vi.mocked( addTranslation ).mockReturnValue( [] );

		vi.mocked( PO.parse ).mockImplementation( file => {
			if ( file === enTranslations.toString() ) {
				return enTranslations;
			}

			if ( file === zhTranslations.toString() ) {
				return zhTranslations;
			}

			return null;
		} );

		vi.mocked( PO.parsePluralForms ).mockReturnValue( { nplurals: 4 } );

		vi.mocked( PO.Item ).mockImplementation( class {
			constructor( ...args ) {
				stubs.poItemConstructor( ...args );

				this.msgid = '';
				this.msgctxt = '';
				this.msgstr = [];
				this.msgid_plural = '';
			}
		} );

		vi.mocked( glob.sync ).mockImplementation( pattern => {
			return languages.map( language => pattern.replace( '*', language.languageFileName ) );
		} );

		vi.mocked( fs.readFileSync ).mockImplementation( filePath => {
			if ( filePath.endsWith( 'en.po' ) ) {
				return enTranslations.toString();
			}

			if ( filePath.endsWith( 'zh-tw.po' ) ) {
				return zhTranslations.toString();
			}

			return null;
		} );

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
		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( fs.readFileSync ).toHaveBeenCalledTimes( 3 );
		expect( fs.readFileSync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-foo/lang/translations/en.po', 'utf-8' );
		expect( fs.readFileSync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-foo/lang/translations/zh-tw.po', 'utf-8' );
	} );

	it( 'should update file header', () => {
		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( enTranslations.headers ).toEqual( {
			Language: 'en',
			'Plural-Forms': 'nplurals=4; plural=example plural formula;',
			'Content-Type': 'text/plain; charset=UTF-8'
		} );

		expect( zhTranslations.headers ).toEqual( {
			Language: 'zh_TW',
			'Plural-Forms': 'nplurals=4; plural=example plural formula;',
			'Content-Type': 'text/plain; charset=UTF-8'
		} );
	} );

	it( 'should remove unused translations', () => {
		zhTranslations.items.push(
			{ msgid: 'id3' },
			{ msgid: 'id4' }
		);

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( zhTranslations.items ).toEqual( [
			expect.objectContaining( { msgid: 'id1' } ),
			expect.objectContaining( { msgid: 'id2' } )
		] );
	} );

	it( 'should remove translations when the English source changed the singular form', () => {
		defaultOptions.sourceMessages.find( msg => msg.id === 'id1' ).string = 'Changed example message 1';

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( zhTranslations.items ).toEqual( [
			expect.objectContaining( {
				msgid: 'id2',
				msgstr: [
					'Example message 2 in zh_TW',
					'Example message 2 - plural form in zh_TW',
					'',
					''
				]
			} ),
			expect.objectContaining( {
				msgid: 'id1',
				msgstr: []
			} )
		] );
	} );

	it( 'should remove translations when the English source changed the plural form', () => {
		defaultOptions.sourceMessages.find( msg => msg.id === 'id2' ).plural = 'Changed plural form for example message 2';

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( zhTranslations.items ).toEqual( [
			expect.objectContaining( {
				msgid: 'id1',
				msgstr: [ 'Example message 1 in zh_TW' ]
			} ),
			expect.objectContaining( {
				msgid: 'id2',
				msgstr: [
					'',
					'',
					'',
					''
				]
			} )
		] );
	} );

	it( 'should not remove translations when there is no related source message', () => {
		defaultOptions.sourceMessages = [];

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( zhTranslations.items ).toEqual( [
			expect.objectContaining( {
				msgid: 'id1',
				msgstr: [ 'Example message 1 in zh_TW' ]
			} ),
			expect.objectContaining( {
				msgid: 'id2',
				msgstr: [
					'Example message 2 in zh_TW',
					'Example message 2 - plural form in zh_TW',
					'',
					''
				]
			} )
		] );
	} );

	it( 'should not remove translations when there is no related English translation', () => {
		enTranslations.items = [];

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( zhTranslations.items ).toEqual( [
			expect.objectContaining( {
				msgid: 'id1',
				msgstr: [ 'Example message 1 in zh_TW' ]
			} ),
			expect.objectContaining( {
				msgid: 'id2',
				msgstr: [
					'Example message 2 in zh_TW',
					'Example message 2 - plural form in zh_TW',
					'',
					''
				]
			} )
		] );
	} );

	it( 'should add missing translations', () => {
		vi.mocked( addTranslation ).mockReturnValue( [ 'added missing translation' ] );
		zhTranslations.items = [];

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( addTranslation ).toHaveBeenCalledTimes( 2 );

		expect( addTranslation ).toHaveBeenCalledWith( {
			languageCode: 'zh',
			message: {
				id: 'id1',
				string: 'Example message 1'
			},
			numberOfPluralForms: 4
		} );

		expect( addTranslation ).toHaveBeenCalledWith( {
			languageCode: 'zh',
			message: {
				id: 'id2',
				plural: 'Example message 2 - plural form',
				string: 'Example message 2'
			},
			numberOfPluralForms: 4
		} );

		expect( zhTranslations.items ).toEqual( [
			expect.objectContaining( {
				msgid: 'id1',
				msgctxt: 'Context for example message 1',
				msgid_plural: '',
				msgstr: expect.arrayContaining( [ 'added missing translation' ] )
			} ),
			expect.objectContaining( {
				msgid: 'id2',
				msgctxt: 'Context for example message 2',
				msgid_plural: 'Example message 2 - plural form',
				msgstr: expect.arrayContaining( [ 'added missing translation' ] )
			} )
		] );
	} );

	it( 'should remove existing plural forms if a source file contains more than a language defines', () => {
		zhTranslations.items = [
			{
				msgid: 'id1',
				msgctxt: 'Context for example message 1',
				msgid_plural: '',
				msgstr: [ 'Example message 1' ]
			},
			{
				msgid: 'id2',
				msgctxt: 'Context for example message 2',
				msgid_plural: 'Example message 2 - plural form',
				msgstr: [ 'Example message 2', '2', '3', '4', '5', '6' ]
			}
		];

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( zhTranslations.items ).toEqual( [
			// `id1` is not updated as it does not offer plural forms.
			{
				msgid: 'id1',
				msgctxt: 'Context for example message 1',
				msgid_plural: '',
				msgstr: [ 'Example message 1' ]
			},
			{
				msgid: 'id2',
				msgctxt: 'Context for example message 2',
				msgid_plural: 'Example message 2 - plural form',
				msgstr: [ 'Example message 2', '2', '3', '4' ]
			}
		] );
	} );

	it( 'should add empty plural forms if a source file contains less than a language defines', () => {
		zhTranslations.items = [
			{
				msgid: 'id1',
				msgctxt: 'Context for example message 1',
				msgid_plural: '',
				msgstr: [ 'Example message 1' ]
			},
			{
				msgid: 'id2',
				msgctxt: 'Context for example message 2',
				msgid_plural: 'Example message 2 - plural form',
				msgstr: [ 'Example message 2', '2' ]
			}
		];

		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( zhTranslations.items ).toEqual( [
			// `id1` is not updated as it does not offer plural forms.
			{
				msgid: 'id1',
				msgctxt: 'Context for example message 1',
				msgid_plural: '',
				msgstr: [ 'Example message 1' ]
			},
			{
				msgid: 'id2',
				msgctxt: 'Context for example message 2',
				msgid_plural: 'Example message 2 - plural form',
				msgstr: [ 'Example message 2', '2', '', '' ]
			}
		] );
	} );

	it( 'should save updated translation files on filesystem after cleaning the content', () => {
		synchronizeTranslationsBasedOnContext( defaultOptions );

		expect( cleanTranslationFileContent ).toHaveBeenCalledTimes( 2 );

		expect( fs.writeFileSync ).toHaveBeenCalledTimes( 2 );
		expect( fs.writeFileSync ).toHaveBeenCalledWith(
			'/absolute/path/to/packages/ckeditor5-foo/lang/translations/en.po',
			'Clean PO file content.',
			'utf-8'
		);
		expect( fs.writeFileSync ).toHaveBeenCalledWith(
			'/absolute/path/to/packages/ckeditor5-foo/lang/translations/zh-tw.po',
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
