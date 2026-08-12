/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import os from 'node:os';
import upath from 'upath';
import { afterEach, describe, expect, it } from 'vitest';
import { readTranslationFile, serializeTranslationFile } from '../../lib/utils/translationfile.js';

describe( 'translation file utilities', () => {
	let filePath;

	afterEach( () => {
		if ( filePath ) {
			fs.rmSync( upath.dirname( filePath ), { recursive: true, force: true } );
		}
	} );

	it( 'serializes deterministic, typed TypeScript and reads it back', async () => {
		filePath = upath.join( fs.mkdtempSync( upath.join( os.tmpdir(), 'cke5-translation-file-' ) ), 'pl.ts' );
		const content = serializeTranslationFile( {
			language: 'pl',
			dictionary: { Second: [ 'dwa', 'drugie' ], First: 'pierwsze' },
			contexts: { First: 'First context.', Second: 'Second context.' },
			pluralFunction: '( n == 1 ? 0 : 1 )'
		} );
		fs.writeFileSync( filePath, content );

		expect( content.indexOf( '\'First\':' ) ).toBeLessThan( content.indexOf( '\'Second\':' ) );
		expect( content ).toContain( 'import type { Translations } from \'@ckeditor/ckeditor5-utils\';' );
		expect( content ).toContain( 'const translations: Translations =' );
		expect( ( await readTranslationFile( filePath ) ).dictionary ).toEqual( {
			First: 'pierwsze',
			Second: [ 'dwa', 'drugie' ]
		} );
		expect( ( await readTranslationFile( filePath ) ).getPluralForm( 2 ) ).toBe( 1 );
	} );

	it( 'serializes a custom translations type import source', () => {
		const content = serializeTranslationFile( {
			language: 'en',
			dictionary: { Example: 'Example' },
			contexts: { Example: 'An example.' },
			translationsTypeImportSource: 'ckeditor5'
		} );

		expect( content ).toContain( 'import type { Translations } from \'ckeditor5\';' );
	} );

	it( 'reads the translations type import source and preserves the file preamble', async () => {
		filePath = upath.join( fs.mkdtempSync( upath.join( os.tmpdir(), 'cke5-translation-file-' ) ), 'en.ts' );
		const preamble = '// Keep this comment.\n\n';
		const content = serializeTranslationFile( {
			language: 'en',
			dictionary: { Example: 'Example' },
			contexts: { Example: 'An example.' },
			preamble,
			translationsTypeImportSource: 'ckeditor5'
		} ).replace(
			'import type { Translations } from \'ckeditor5\';',
			'import type {\n\tTranslations\n} from "ckeditor5";'
		);
		fs.writeFileSync( filePath, content );

		expect( await readTranslationFile( filePath ) ).toMatchObject( {
			preamble,
			translationsTypeImportSource: 'ckeditor5'
		} );
	} );

	it( 'rejects files without a Translations type import', async () => {
		filePath = upath.join( fs.mkdtempSync( upath.join( os.tmpdir(), 'cke5-translation-file-' ) ), 'en.ts' );
		fs.writeFileSync( filePath, 'export default { en: { dictionary: {} } };\n' );

		await expect( readTranslationFile( filePath ) ).rejects.toThrow(
			`Missing Translations type import in translation file: ${ filePath }.`
		);
	} );

	it( 'rejects files with invalid TypeScript', async () => {
		filePath = upath.join( fs.mkdtempSync( upath.join( os.tmpdir(), 'cke5-translation-file-' ) ), 'en.ts' );
		fs.writeFileSync( filePath, 'import type { Translations } from \'ckeditor5\';\nexport default {' );

		await expect( readTranslationFile( filePath ) ).rejects.toThrow(
			`Could not parse translation file: ${ filePath }.`
		);
	} );

	it( 'rejects files containing more than one language', async () => {
		filePath = upath.join( fs.mkdtempSync( upath.join( os.tmpdir(), 'cke5-translation-file-' ) ), 'en.ts' );
		fs.writeFileSync( filePath, `import type { Translations } from 'ckeditor5';
export default { en: { dictionary: {} }, pl: { dictionary: {} } };` );

		await expect( readTranslationFile( filePath ) ).rejects.toThrow(
			`Expected exactly one language in translation file: ${ filePath }.`
		);
	} );
} );
