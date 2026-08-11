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
			contexts: sourceContext.contextContent
		} ) );
		expect( fs.readFileSync( upath.join( destination, 'lang/translations/pl.ts' ), 'utf-8' ) ).toBe( serializeTranslationFile( {
			language: 'pl',
			dictionary: { Existing: 'Istniejące', Move: 'Przenieś' },
			contexts: destinationContext.contextContent
		} ) );
		expect( destinationContext.contextContent.Move ).toBe( 'Move this.' );
	} );
} );

function createPackageContext( packagePath, contextContent ) {
	const contextFilePath = upath.join( packagePath, 'lang/contexts.json' );
	fs.mkdirSync( upath.dirname( contextFilePath ), { recursive: true } );
	fs.writeFileSync( contextFilePath, JSON.stringify( contextContent ) );

	return { packagePath, contextContent, contextFilePath };
}

function write( packagePath, language, dictionary, contexts ) {
	const filePath = upath.join( packagePath, `lang/translations/${ language }.ts` );
	fs.mkdirSync( upath.dirname( filePath ), { recursive: true } );
	fs.writeFileSync( filePath, serializeTranslationFile( {
		language,
		dictionary,
		contexts,
		skipLicenseHeader: true
	} ) );
}
