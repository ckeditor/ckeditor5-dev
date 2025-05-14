/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { test } from 'vitest';
import { rollup, type RollupOutput } from 'rollup';
import { verifyChunk } from '../../_utils/utils.js';

import { translations, type RollupTranslationsOptions } from '../../../src/index.js';

// eslint-disable-next-line @stylistic/max-len
const ALL_POLISH_TRANSLATIONS = 'export default {"pl":{"dictionary":{"Hello world":"Witaj świecie","%0 files":["%0 plik","%0 pliki","%0 plików","%0 plików"]},getPluralForm(n){return (n==1 ? 0 : (n%10>=2 && n%10<=4) && (n%100<12 || n%100>14) ? 1 : n!=1 && (n%10>=0 && n%10<=1) || (n%10>=5 && n%10<=9) || (n%100>=12 && n%100<=14) ? 2 : 3);}}}';

// eslint-disable-next-line @stylistic/max-len
const POLISH_TRANSLATIONS_FROM_ROOT = 'export default {"pl":{"dictionary":{"Hello world":"Witaj świecie"},getPluralForm(n){return (n==1 ? 0 : (n%10>=2 && n%10<=4) && (n%100<12 || n%100>14) ? 1 : n!=1 && (n%10>=0 && n%10<=1) || (n%10>=5 && n%10<=9) || (n%100>=12 && n%100<=14) ? 2 : 3);}}}';

// eslint-disable-next-line @stylistic/max-len
const GERMAN_TRANSLATIONS_FROM_ROOT = 'export default {"de":{"dictionary":{"Hello world":"Hallo Welt"},getPluralForm(n){return (n != 1);}}}';

// eslint-disable-next-line @stylistic/max-len
const ENGLISH_TRANSLATIONS_FROM_ROOT = 'export default {"en":{"dictionary":{"Hello world":"Hello world"},"getPluralForm":null}}';

/**
 * Helper function for creating a bundle that won't be written to the file system.
 */
async function generateBundle( options?: RollupTranslationsOptions ): Promise<RollupOutput['output']> {
	const bundle = await rollup( {
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

/**
 * Test how the plugin behaves when no custom options are passed.
 */
test( 'default options', async () => {
	const output = await generateBundle();

	verifyChunk( output, 'translations/pl.js', ALL_POLISH_TRANSLATIONS );
	verifyChunk( output, 'translations/de.js', GERMAN_TRANSLATIONS_FROM_ROOT );
	verifyChunk( output, 'translations/en.js', ENGLISH_TRANSLATIONS_FROM_ROOT );
} );

/**
 * Ensure that changing the `source` option affects which translation files are loaded.
 */
test( 'source', async () => {
	const output = await generateBundle( {
		source: upath.join( import.meta.dirname, '/fixtures/*.po' )
	} );

	verifyChunk( output, 'translations/pl.js', POLISH_TRANSLATIONS_FROM_ROOT );
	verifyChunk( output, 'translations/de.js', GERMAN_TRANSLATIONS_FROM_ROOT );
	verifyChunk( output, 'translations/en.js', ENGLISH_TRANSLATIONS_FROM_ROOT );
} );

/**
 * Ensure that changing the `destination` option affects where the output translation files are placed.
 */
test( 'destination', async () => {
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
test( 'typings', async () => {
	const output = await generateBundle( {
		destination: 'languages'
	} );

	verifyChunk( output, 'languages/en.d.ts', 'import type { Translations } from \'@ckeditor/ckeditor5-utils\'' );
} );
