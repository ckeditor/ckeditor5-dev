/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'path';
import { test } from 'vitest';
import { rollup, type RollupOutput } from 'rollup';
import { verifyChunk } from '../../_test-utils/utils.js';

import { translations, type RollupTranslationsOptions } from '../../../src/index.js';

// eslint-disable-next-line max-len
const ALL_POLISH_TRANSLATIONS = '\nexport default {"pl":{"dictionary":{"Hello world":"Witaj świecie","%0 files":["%0 plik","%0 pliki","%0 plików","%0 plików"]},getPluralForm(n){return (n==1 ? 0 : (n%10>=2 && n%10<=4) && (n%100<12 || n%100>14) ? 1 : n!=1 && (n%10>=0 && n%10<=1) || (n%10>=5 && n%10<=9) || (n%100>=12 && n%100<=14) ? 2 : 3);}}}';

// eslint-disable-next-line max-len
const POLISH_TRANSLATIONS_FROM_ROOT = '\nexport default {"pl":{"dictionary":{"Hello world":"Witaj świecie"},getPluralForm(n){return (n==1 ? 0 : (n%10>=2 && n%10<=4) && (n%100<12 || n%100>14) ? 1 : n!=1 && (n%10>=0 && n%10<=1) || (n%10>=5 && n%10<=9) || (n%100>=12 && n%100<=14) ? 2 : 3);}}}';

// eslint-disable-next-line max-len
const GERMAN_TRANSLATIONS_FROM_ROOT = '\nexport default {"de":{"dictionary":{"Hello world":"Hallo Welt"},getPluralForm(n){return (n != 1);}}}';

// eslint-disable-next-line max-len
const ENGLISH_TRANSLATIONS_FROM_ROOT = '\nexport default {"en":{"dictionary":{"Hello world":"Hello world"},"getPluralForm":null}}';

/**
 * Helper function for creating a bundle that won't be written to the file system.
 */
async function generateBundle(
	options?: RollupTranslationsOptions,
	banner?: string
): Promise<RollupOutput['output']> {
	const bundle = await rollup( {
		input: join( import.meta.dirname, './fixtures/input.js' ),
		plugins: [
			translations( options )
		]
	} );

	const { output } = await bundle.generate( { format: 'esm', banner } );

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
 * Ensure that the banner is added to the top of the generated bundle.
 */
test( 'banner', async () => {
	const banner = 'BANNER';
	const output = await generateBundle( undefined, banner );

	verifyChunk( output, 'translations/pl.js', banner + ALL_POLISH_TRANSLATIONS );
	verifyChunk( output, 'translations/de.js', banner + GERMAN_TRANSLATIONS_FROM_ROOT );
	verifyChunk( output, 'translations/en.js', banner + ENGLISH_TRANSLATIONS_FROM_ROOT );
} );

/**
 * Ensure that changing the `source` option affects which translation files are loaded.
 */
test( 'source', async () => {
	const output = await generateBundle( {
		source: join( import.meta.dirname, './fixtures/*.po' )
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
