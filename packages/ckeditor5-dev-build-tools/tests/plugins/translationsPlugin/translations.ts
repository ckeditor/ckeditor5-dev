/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { describe, expect, it } from 'vitest';
import { rolldown, type RolldownOutput } from 'rolldown';
import { verifyChunk } from '../../_utils/utils.js';

import { translations, type RollupTranslationsOptions } from '../../../src/index.js';

// eslint-disable-next-line @stylistic/max-len
const ALL_POLISH_TRANSLATIONS = 'export default {"pl":{"dictionary":{"Hello world":"Witaj świecie","%0 files":["%0 plik","%0 pliki","%0 plików","%0 plików"]}';

const POLISH_TRANSLATIONS_FROM_ROOT = 'export default {"pl":{"dictionary":{"Hello world":"Witaj świecie"}';

const GERMAN_TRANSLATIONS_FROM_ROOT = 'export default {"de":{"dictionary":{"Hello world":"Hallo Welt"}';

const ENGLISH_TRANSLATIONS_FROM_ROOT = 'export default {"en":{"dictionary":{"Hello world":"Hello world"}}}';

/**
 * Helper function for creating a bundle that won't be written to the file system.
 */
async function generateBundle( options?: RollupTranslationsOptions ): Promise<RolldownOutput['output']> {
	const bundle = await rolldown( {
		input: upath.join( import.meta.dirname, '/fixtures/input.js' ),
		plugins: [
			translations( options )
		]
	} );

	const { output } = await bundle.generate( {
		format: 'esm',
		file: 'input.js'
	} );

	return output;
}

describe( 'translations()', () => {
	/**
	 * Test how the plugin behaves when no custom options are passed.
	 */
	it( 'default options', async () => {
		const output = await generateBundle();

		verifyChunk( output, 'translations/pl.js', ALL_POLISH_TRANSLATIONS );
		verifyChunk( output, 'translations/pl.js', '"getPluralForm":' );
		verifyChunk( output, 'translations/de.js', GERMAN_TRANSLATIONS_FROM_ROOT );
		verifyChunk( output, 'translations/en.js', ENGLISH_TRANSLATIONS_FROM_ROOT );
		expect( output ).not.toEqual( expect.arrayContaining( [ expect.objectContaining( { fileName: 'translations/ignored.js' } ) ] ) );
	} );

	/**
	 * Ensure that changing the `source` option affects which translation files are loaded.
	 */
	it( 'source', async () => {
		const output = await generateBundle( {
			source: upath.join( import.meta.dirname, '/fixtures/translations/*.ts' )
		} );

		verifyChunk( output, 'translations/pl.js', POLISH_TRANSLATIONS_FROM_ROOT );
		verifyChunk( output, 'translations/pl.js', '"getPluralForm":' );
		verifyChunk( output, 'translations/de.js', GERMAN_TRANSLATIONS_FROM_ROOT );
		verifyChunk( output, 'translations/en.js', ENGLISH_TRANSLATIONS_FROM_ROOT );
	} );

	/**
	 * Ensure that changing the `destination` option affects where the output translation files are placed.
	 */
	it( 'destination', async () => {
		const output = await generateBundle( {
			destination: 'languages'
		} );

		verifyChunk( output, 'languages/pl.js', ALL_POLISH_TRANSLATIONS );
		verifyChunk( output, 'languages/de.js', GERMAN_TRANSLATIONS_FROM_ROOT );
		verifyChunk( output, 'languages/en.js', ENGLISH_TRANSLATIONS_FROM_ROOT );
	} );

	/**
	 * Ensure that the typings are generated and that the `Translations` type is imported from `@ckeditor/ckeditor5-utils`.
	 */
	it( 'typings', async () => {
		const output = await generateBundle( {
			destination: 'languages'
		} );

		verifyChunk( output, 'languages/en.d.ts', 'import type { Translations } from \'@ckeditor/ckeditor5-utils\'' );
	} );

	it( 'does not overwrite an existing plural function with a dictionary-only UMD translation', async () => {
		const output = await generateBundle();

		verifyChunk( output, 'translations/en.umd.js', 'if ( translations.getPluralForm )' );
	} );
} );
