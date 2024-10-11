/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import PO from 'pofile';
import { glob } from 'glob';
import cleanTranslationFileContent from '../../lib/utils/cleantranslationfilecontent.js';
import createMissingPackageTranslations from '../../lib/utils/createmissingpackagetranslations.js';
import updatePackageTranslations from '../../lib/utils/updatepackagetranslations.js';

vi.mock( 'fs-extra' );
vi.mock( 'pofile' );
vi.mock( 'glob' );
vi.mock( '../../lib/utils/createmissingpackagetranslations.js' );
vi.mock( '../../lib/utils/cleantranslationfilecontent.js' );

describe( 'updatePackageTranslations()', () => {
	let defaultOptions, translations, stubs;

	beforeEach( () => {
		defaultOptions = {
			packageContexts: [
				{
					packagePath: 'packages/ckeditor5-foo',
					contextContent: {
						'id1': 'Context for example message 1',
						'id2': 'Context for example message 2'
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
			headers: {},
			items: [
				{ msgid: 'id1' },
				{ msgid: 'id2' }
			],
			toString: () => 'Raw PO file content.'
		};

		stubs = {
			poItemConstructor: vi.fn()
		};

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

		vi.mocked( cleanTranslationFileContent ).mockReturnValue( 'Clean PO file content.' );
	} );

	it( 'should be a function', () => {
		expect( updatePackageTranslations ).toBeInstanceOf( Function );
	} );

	it( 'should create missing translations', () => {
		updatePackageTranslations( defaultOptions );

		expect( createMissingPackageTranslations ).toHaveBeenCalledTimes( 1 );
		expect( createMissingPackageTranslations ).toHaveBeenCalledWith( {
			packagePath: 'packages/ckeditor5-foo',
			skipLicenseHeader: false
		} );
	} );

	it( 'should create missing translations with skipping the license header', () => {
		defaultOptions.skipLicenseHeader = true;

		updatePackageTranslations( defaultOptions );

		expect( createMissingPackageTranslations ).toHaveBeenCalledTimes( 1 );
		expect( createMissingPackageTranslations ).toHaveBeenCalledWith( {
			packagePath: 'packages/ckeditor5-foo',
			skipLicenseHeader: true
		} );
	} );

	it( 'should not update any files when package does not contain translation context', () => {
		defaultOptions.packageContexts = [
			{
				packagePath: 'packages/ckeditor5-foo',
				contextContent: {}
			}
		];

		updatePackageTranslations( defaultOptions );

		expect( createMissingPackageTranslations ).not.toHaveBeenCalled();
		expect( fs.writeFileSync ).not.toHaveBeenCalled();
	} );

	it( 'should search for translation files', () => {
		updatePackageTranslations( defaultOptions );

		expect( glob.sync ).toHaveBeenCalledTimes( 1 );
		expect( glob.sync ).toHaveBeenCalledWith( 'packages/ckeditor5-foo/lang/translations/*.po' );
	} );

	it( 'should parse each translation file', () => {
		vi.mocked( glob.sync ).mockImplementation( pattern => {
			return [ 'en', 'pl' ].map( language => pattern.replace( '*', language ) );
		} );

		updatePackageTranslations( defaultOptions );

		expect( fs.readFileSync ).toHaveBeenCalledTimes( 2 );
		expect( fs.readFileSync ).toHaveBeenCalledWith( 'packages/ckeditor5-foo/lang/translations/en.po', 'utf-8' );
		expect( fs.readFileSync ).toHaveBeenCalledWith( 'packages/ckeditor5-foo/lang/translations/pl.po', 'utf-8' );
	} );

	it( 'should remove unused translations', () => {
		translations.items.push(
			{ msgid: 'id3' },
			{ msgid: 'id4' }
		);

		updatePackageTranslations( defaultOptions );

		expect( translations.items ).toEqual( [
			{ msgid: 'id1' },
			{ msgid: 'id2' }
		] );
	} );

	it( 'should add missing translations', () => {
		translations.items = [];

		updatePackageTranslations( defaultOptions );

		expect( translations.items ).toEqual( [
			{
				msgid: 'Example message 1',
				msgctxt: 'Context for example message 1',
				msgid_plural: '',
				msgstr: [ '' ]
			},
			{
				msgid: 'Example message 2',
				msgctxt: 'Context for example message 2',
				msgid_plural: 'Example message 2 - plural form',
				msgstr: [ '', '', '', '' ]
			}
		] );
	} );

	it( 'should save updated translation files on filesystem after cleaning the content', () => {
		updatePackageTranslations( defaultOptions );

		expect( cleanTranslationFileContent ).toHaveBeenCalledTimes( 1 );
		expect( cleanTranslationFileContent ).toHaveBeenCalledWith( 'Raw PO file content.' );

		expect( fs.writeFileSync ).toHaveBeenCalledTimes( 1 );
		expect( fs.writeFileSync ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/lang/translations/en.po',
			'Clean PO file content.',
			'utf-8'
		);
	} );

	it( 'should not save translation files on filesystem if their content is not updated', () => {
		vi.mocked( cleanTranslationFileContent ).mockImplementation( input => input );

		updatePackageTranslations( defaultOptions );

		expect( fs.writeFileSync ).not.toHaveBeenCalled();
	} );
} );
