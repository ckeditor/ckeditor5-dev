/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import os from 'node:os';
import upath from 'upath';
import { afterEach, describe, expect, it, vi } from 'vitest';
import createMissingPackageTranslations from '../../lib/utils/createmissingpackagetranslations.js';
import synchronizeTranslationsBasedOnContext from '../../lib/utils/synchronizetranslationsbasedoncontext.js';
import { serializeTranslationFile } from '../../lib/utils/translationfile.js';

vi.mock( '../../lib/utils/createmissingpackagetranslations.js' );

describe( 'synchronizeTranslationsBasedOnContext()', () => {
	let packagePath;
	let emptyPackagePath;
	let coreRootPath;

	afterEach( () => {
		if ( packagePath ) {
			fs.rmSync( packagePath, { recursive: true, force: true } );
		}

		if ( emptyPackagePath ) {
			fs.rmSync( emptyPackagePath, { recursive: true, force: true } );
		}

		if ( coreRootPath ) {
			fs.rmSync( coreRootPath, { recursive: true, force: true } );
		}
	} );

	it( 'synchronizes dictionaries in context order and aligns plural forms', async () => {
		packagePath = fs.mkdtempSync( upath.join( os.tmpdir(), 'ckeditor5-foo-' ) );
		const translationsPath = upath.join( packagePath, 'lang', 'translations' );
		const contexts = {
			Changed: 'Changed context.',
			Plural: 'Plural context.',
			ContextOnly: 'Context-only context.',
			ContextOnlyPlural: 'Context-only plural context.',
			ContextMissing: 'Context missing context.',
			MissingValue: 'Missing value context.',
			MissingPlural: 'Missing plural context.'
		};
		fs.mkdirSync( translationsPath, { recursive: true } );
		write( 'en', {
			Changed: 'Old English',
			Plural: [ '%0 item', '%0 items' ],
			ContextOnly: 'Context only',
			ContextOnlyPlural: [ '%0 context item', '%0 context items', 'Extra form' ],
			Stale: 'Stale'
		} );
		write( 'pl', {
			Changed: 'Stare tłumaczenie',
			Plural: '%0 rzecz',
			ContextOnly: 'Tylko kontekst',
			ContextOnlyPlural: [ '%0 rzecz kontekstowa' ],
			Stale: 'Nieaktualne'
		} );

		await synchronizeTranslationsBasedOnContext( {
			packageContexts: [
				{ packagePath, contextContent: contexts },
				{
					packagePath: emptyPackagePath = fs.mkdtempSync( upath.join( os.tmpdir(), 'ckeditor5-empty-' ) ),
					contextContent: {}
				}
			],
			sourceMessages: [
				{ id: 'Changed', string: 'New English' },
				{ id: 'Plural', string: '%0 item', plural: '%0 items' },
				{ id: 'MissingValue', string: 'Missing value' },
				{ id: 'MissingPlural', string: '%0 missing item', plural: '%0 missing items' }
			],
			skipLicenseHeader: true
		} );

		expect( createMissingPackageTranslations ).toHaveBeenCalledWith( {
			packagePath,
			contexts,
			skipLicenseHeader: true
		} );
		expect( fs.readFileSync( upath.join( translationsPath, 'en.ts' ), 'utf-8' ) ).toBe( serializeTranslationFile( {
			language: 'en',
			dictionary: {
				Changed: 'New English',
				Plural: [ '%0 item', '%0 items' ],
				ContextOnly: 'Context only',
				ContextOnlyPlural: [ '%0 context item', '%0 context items' ],
				MissingValue: 'Missing value',
				MissingPlural: [ '%0 missing item', '%0 missing items' ]
			},
			contexts,
			skipLicenseHeader: true
		} ) );
		expect( fs.readFileSync( upath.join( translationsPath, 'pl.ts' ), 'utf-8' ) ).toBe( serializeTranslationFile( {
			language: 'pl',
			dictionary: {
				Changed: '',
				Plural: [ '%0 rzecz', '', '' ],
				ContextOnly: 'Tylko kontekst',
				ContextOnlyPlural: [ '%0 rzecz kontekstowa', '', '' ],
				MissingValue: '',
				MissingPlural: [ '', '', '' ]
			},
			contexts,
			skipLicenseHeader: true
		} ) );

		function write( language, dictionary ) {
			fs.writeFileSync( upath.join( translationsPath, `${ language }.ts` ), serializeTranslationFile( {
				language,
				dictionary,
				contexts: { ...contexts, Stale: 'Stale context.' },
				skipLicenseHeader: true
			} ) );
		}
	} );

	it( 'resets translations when an English plural form changes', async () => {
		packagePath = fs.mkdtempSync( upath.join( os.tmpdir(), 'ckeditor5-foo-' ) );
		const translationsPath = upath.join( packagePath, 'lang', 'translations' );
		const contexts = { Message: 'Message context.' };
		fs.mkdirSync( translationsPath, { recursive: true } );
		fs.writeFileSync( upath.join( translationsPath, 'en.ts' ), serializeTranslationFile( {
			language: 'en',
			dictionary: { Message: [ '%0 old message', '%0 old messages' ] },
			contexts,
			skipLicenseHeader: true
		} ) );
		fs.writeFileSync( upath.join( translationsPath, 'pl.ts' ), serializeTranslationFile( {
			language: 'pl',
			dictionary: { Message: [ '%0 wiadomość', '%0 wiadomości', '%0 wiadomości' ] },
			contexts,
			skipLicenseHeader: true
		} ) );

		await synchronizeTranslationsBasedOnContext( {
			packageContexts: [ { packagePath, contextContent: contexts } ],
			sourceMessages: [ { id: 'Message', string: '%0 new message', plural: '%0 new messages' } ],
			skipLicenseHeader: true
		} );

		expect( fs.readFileSync( upath.join( translationsPath, 'en.ts' ), 'utf-8' ) ).toBe( serializeTranslationFile( {
			language: 'en',
			dictionary: { Message: [ '%0 new message', '%0 new messages' ] },
			contexts,
			skipLicenseHeader: true
		} ) );
		expect( fs.readFileSync( upath.join( translationsPath, 'pl.ts' ), 'utf-8' ) ).toBe( serializeTranslationFile( {
			language: 'pl',
			dictionary: { Message: [ '', '', '' ] },
			contexts,
			skipLicenseHeader: true
		} ) );
	} );

	it( 'uses the core package plural function when synchronizing', async () => {
		coreRootPath = fs.mkdtempSync( upath.join( os.tmpdir(), 'ckeditor5-core-' ) );
		packagePath = upath.join( coreRootPath, 'ckeditor5-core' );
		const translationsPath = upath.join( packagePath, 'lang', 'translations' );
		const contexts = { Message: 'Message context.' };
		fs.mkdirSync( translationsPath, { recursive: true } );
		fs.writeFileSync( upath.join( translationsPath, 'en.ts' ), serializeTranslationFile( {
			language: 'en',
			dictionary: { Message: 'Message' },
			contexts,
			skipLicenseHeader: true
		} ) );

		await synchronizeTranslationsBasedOnContext( {
			packageContexts: [ { packagePath, contextContent: contexts } ],
			sourceMessages: [ { id: 'Message', string: 'Message' } ],
			skipLicenseHeader: true
		} );

		expect( fs.readFileSync( upath.join( translationsPath, 'en.ts' ), 'utf-8' ) ).toContain( 'getPluralForm:' );
	} );

	it( 'uses the configured core package path when its basename differs', async () => {
		packagePath = fs.mkdtempSync( upath.join( os.tmpdir(), 'ckeditor5-custom-core-' ) );
		const translationsPath = upath.join( packagePath, 'lang', 'translations' );
		const contexts = { Message: 'Message context.' };
		fs.mkdirSync( translationsPath, { recursive: true } );
		fs.writeFileSync( upath.join( translationsPath, 'en.ts' ), serializeTranslationFile( {
			language: 'en',
			dictionary: { Message: 'Message' },
			contexts,
			skipLicenseHeader: true
		} ) );

		await synchronizeTranslationsBasedOnContext( {
			packageContexts: [ { packagePath, contextContent: contexts } ],
			sourceMessages: [ { id: 'Message', string: 'Message' } ],
			corePackagePath: packagePath,
			skipLicenseHeader: true
		} );

		expect( fs.readFileSync( upath.join( translationsPath, 'en.ts' ), 'utf-8' ) ).toContain( 'getPluralForm:' );
	} );

	it( 'passes a custom translations type import source to generated files', async () => {
		packagePath = fs.mkdtempSync( upath.join( os.tmpdir(), 'ckeditor5-foo-' ) );
		const translationsPath = upath.join( packagePath, 'lang', 'translations' );
		const contexts = { Message: 'Message context.' };
		fs.mkdirSync( translationsPath, { recursive: true } );
		fs.writeFileSync( upath.join( translationsPath, 'en.ts' ), serializeTranslationFile( {
			language: 'en',
			dictionary: { Message: 'Message' },
			contexts,
			skipLicenseHeader: true
		} ) );

		await synchronizeTranslationsBasedOnContext( {
			packageContexts: [ { packagePath, contextContent: contexts } ],
			sourceMessages: [ { id: 'Message', string: 'Message' } ],
			skipLicenseHeader: true,
			translationsTypeImportSource: 'custom-package'
		} );

		expect( createMissingPackageTranslations ).toHaveBeenCalledWith( expect.objectContaining( {
			packagePath,
			translationsTypeImportSource: 'custom-package'
		} ) );
		expect( fs.readFileSync( upath.join( translationsPath, 'en.ts' ), 'utf-8' ) ).toContain(
			'import type { Translations } from \'custom-package\';'
		);
	} );

	it( 'rejects translation files with unsupported languages', async () => {
		packagePath = fs.mkdtempSync( upath.join( os.tmpdir(), 'ckeditor5-foo-' ) );
		const translationsPath = upath.join( packagePath, 'lang', 'translations' );
		const contexts = { Message: 'Message context.' };
		fs.mkdirSync( translationsPath, { recursive: true } );

		for ( const language of [ 'en', 'xx' ] ) {
			fs.writeFileSync( upath.join( translationsPath, language + '.ts' ), serializeTranslationFile( {
				language,
				dictionary: { Message: 'Message' },
				contexts,
				skipLicenseHeader: true
			} ) );
		}

		await expect( synchronizeTranslationsBasedOnContext( {
			packageContexts: [ { packagePath, contextContent: contexts } ],
			sourceMessages: [ { id: 'Message', string: 'Message' } ],
			skipLicenseHeader: true
		} ) ).rejects.toThrow( /Unsupported translation language "xx".*xx\.ts/ );
	} );

	it.each( [
		{ hasLicenseHeader: true, skipLicenseHeader: true },
		{ hasLicenseHeader: false, skipLicenseHeader: false }
	] )( 'preserves the existing license header state when skipLicenseHeader is $skipLicenseHeader', async ( {
		hasLicenseHeader,
		skipLicenseHeader
	} ) => {
		packagePath = fs.mkdtempSync( upath.join( os.tmpdir(), 'ckeditor5-foo-' ) );
		const translationsPath = upath.join( packagePath, 'lang', 'translations' );
		const contexts = { Message: 'Message context.' };
		const originalFile = serializeTranslationFile( {
			language: 'en',
			dictionary: { Message: 'Message' },
			contexts,
			skipLicenseHeader: !hasLicenseHeader
		} );

		fs.mkdirSync( translationsPath, { recursive: true } );
		fs.writeFileSync( upath.join( translationsPath, 'en.ts' ), originalFile );
		const writeFileSpy = vi.spyOn( fs, 'writeFileSync' );

		await synchronizeTranslationsBasedOnContext( {
			packageContexts: [ { packagePath, contextContent: contexts } ],
			sourceMessages: [ { id: 'Message', string: 'Message' } ],
			skipLicenseHeader
		} );

		expect( fs.readFileSync( upath.join( translationsPath, 'en.ts' ), 'utf-8' ) ).toBe( originalFile );
		expect( writeFileSpy ).not.toHaveBeenCalled();
	} );
} );
