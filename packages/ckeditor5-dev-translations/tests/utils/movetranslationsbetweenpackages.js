/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import os from 'node:os';
import upath from 'upath';
import { afterEach, describe, expect, it } from 'vitest';
import moveTranslationsBetweenPackages from '../../lib/utils/movetranslationsbetweenpackages.js';
import { serializeTranslationFile } from '../../lib/utils/translationfile.js';

describe( 'moveTranslationsBetweenPackages()', () => {
	let rootPath;

	afterEach( () => {
		if ( rootPath ) {
			fs.rmSync( rootPath, { recursive: true, force: true } );
		}
	} );

	it( 'moves dictionary values and contexts between packages', async () => {
		rootPath = fs.mkdtempSync( upath.join( os.tmpdir(), 'cke5-move-translations-' ) );
		const source = upath.join( rootPath, 'ckeditor5-source' );
		const destination = upath.join( rootPath, 'ckeditor5-destination' );
		const sourceContext = createPackageContext( source, { Move: 'Move this.', Stay: 'Keep this.' } );
		const destinationContext = createPackageContext( destination, { Existing: 'Existing.' } );
		write( source, 'en', { Move: 'Move', Stay: 'Stay' }, sourceContext.contextContent );
		write( source, 'pl', { Move: 'Przenieś', Stay: 'Zostań' }, sourceContext.contextContent );
		write( destination, 'en', { Existing: 'Existing' }, destinationContext.contextContent );
		write( destination, 'pl', { Existing: 'Istniejące' }, destinationContext.contextContent );

		await moveTranslationsBetweenPackages( {
			packageContexts: [ sourceContext, destinationContext ],
			config: [ { source, destination, messageId: 'Move' } ]
		} );

		expect( fs.readFileSync( upath.join( source, 'lang/translations/pl.ts' ), 'utf-8' ) ).toBe( serializeTranslationFile( {
			language: 'pl',
			dictionary: { Stay: 'Zostań' },
			contexts: sourceContext.contextContent,
			skipLicenseHeader: true
		} ) );
		expect( fs.readFileSync( upath.join( destination, 'lang/translations/pl.ts' ), 'utf-8' ) ).toBe( serializeTranslationFile( {
			language: 'pl',
			dictionary: { Existing: 'Istniejące', Move: 'Przenieś' },
			contexts: destinationContext.contextContent,
			skipLicenseHeader: true
		} ) );
		expect( destinationContext.contextContent.Move ).toBe( 'Move this.' );
	} );

	it( 'preserves the translations type import source when moving translations', async () => {
		rootPath = fs.mkdtempSync( upath.join( os.tmpdir(), 'cke5-move-translations-' ) );
		const source = upath.join( rootPath, 'ckeditor5-source' );
		const destination = upath.join( rootPath, 'ckeditor5-destination' );
		const sourceContext = createPackageContext( source, { Move: 'Move this.' } );
		const destinationContext = createPackageContext( destination, { Existing: 'Existing.' } );
		write( source, 'en', { Move: 'Move' }, sourceContext.contextContent, 'ckeditor5' );
		write( destination, 'en', { Existing: 'Existing' }, destinationContext.contextContent, 'custom-package' );

		await moveTranslationsBetweenPackages( {
			packageContexts: [ sourceContext, destinationContext ],
			config: [ { source, destination, messageId: 'Move' } ]
		} );

		expect( fs.readFileSync( upath.join( source, 'lang/translations/en.ts' ), 'utf-8' ) ).toBe( serializeTranslationFile( {
			language: 'en',
			dictionary: {},
			contexts: sourceContext.contextContent,
			skipLicenseHeader: true,
			translationsTypeImportSource: 'ckeditor5'
		} ) );
		expect( fs.readFileSync( upath.join( destination, 'lang/translations/en.ts' ), 'utf-8' ) ).toBe( serializeTranslationFile( {
			language: 'en',
			dictionary: { Existing: 'Existing', Move: 'Move' },
			contexts: destinationContext.contextContent,
			skipLicenseHeader: true,
			translationsTypeImportSource: 'custom-package'
		} ) );
	} );

	it( 'skips entries whose source and destination packages are identical', async () => {
		rootPath = fs.mkdtempSync( upath.join( os.tmpdir(), 'cke5-move-translations-' ) );
		const packagePath = upath.join( rootPath, 'ckeditor5-source' );
		const packageContext = createPackageContext( packagePath, { Move: 'Move this.' } );
		write( packagePath, 'en', { Move: 'Move' }, packageContext.contextContent );
		const originalContext = JSON.stringify( packageContext.contextContent );
		const originalTranslation = fs.readFileSync( upath.join( packagePath, 'lang/translations/en.ts' ), 'utf-8' );

		await moveTranslationsBetweenPackages( {
			packageContexts: [ packageContext ],
			config: [ { source: packagePath, destination: packagePath, messageId: 'Move' } ]
		} );

		expect( packageContext.contextContent ).toEqual( JSON.parse( originalContext ) );
		expect( fs.readFileSync( upath.join( packagePath, 'lang/translations/en.ts' ), 'utf-8' ) ).toBe( originalTranslation );
	} );

	it( 'creates a missing destination file and adds plural forms for the core source package', async () => {
		rootPath = fs.mkdtempSync( upath.join( os.tmpdir(), 'cke5-move-translations-' ) );
		const source = upath.join( rootPath, 'ckeditor5-core' );
		const destination = upath.join( rootPath, 'ckeditor5-destination' );
		const sourceContext = createPackageContext( source, { Move: 'Move this.' } );
		const destinationContext = createPackageContext( destination, {} );
		write( source, 'en', { Move: 'Move' }, sourceContext.contextContent );

		await moveTranslationsBetweenPackages( {
			packageContexts: [ sourceContext, destinationContext ],
			config: [ { source, destination, messageId: 'Move' } ]
		} );

		expect( fs.readFileSync( upath.join( source, 'lang/translations/en.ts' ), 'utf-8' ) ).toContain( 'getPluralForm:' );
		expect( fs.readFileSync( upath.join( destination, 'lang/translations/en.ts' ), 'utf-8' ) ).toContain( '\'Move\': \'Move\'' );
	} );
} );

function createPackageContext( packagePath, contextContent ) {
	const contextFilePath = upath.join( packagePath, 'lang/contexts.json' );
	fs.mkdirSync( upath.dirname( contextFilePath ), { recursive: true } );
	fs.writeFileSync( contextFilePath, JSON.stringify( contextContent ) );

	return { packagePath, contextContent, contextFilePath };
}

function write( packagePath, language, dictionary, contexts, translationsTypeImportSource ) {
	const filePath = upath.join( packagePath, `lang/translations/${ language }.ts` );
	fs.mkdirSync( upath.dirname( filePath ), { recursive: true } );
	fs.writeFileSync( filePath, serializeTranslationFile( {
		language,
		dictionary,
		contexts,
		skipLicenseHeader: true,
		translationsTypeImportSource
	} ) );
}
