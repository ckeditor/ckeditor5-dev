import { test, expect } from 'vitest';
import { rollup, type OutputChunk, type RollupOutput } from 'rollup';

import { translations, type RollupTranslationsOptions } from '../../src/index.js';

const ALL_POLISH_TRANSLATIONS = '\nexport default {"pl":{"dictionary":{"Hello world":"Witaj świecie","%0 files":["%0 plik","%0 pliki","%0 plików","%0 plików"]},getPluralForm(n){return (n==1 ? 0 : (n%10>=2 && n%10<=4) && (n%100<12 || n%100>14) ? 1 : n!=1 && (n%10>=0 && n%10<=1) || (n%10>=5 && n%10<=9) || (n%100>=12 && n%100<=14) ? 2 : 3);}}}'
const POLISH_TRANSLATIONS_FROM_ROOT = '\nexport default {"pl":{"dictionary":{"Hello world":"Witaj świecie"},getPluralForm(n){return (n==1 ? 0 : (n%10>=2 && n%10<=4) && (n%100<12 || n%100>14) ? 1 : n!=1 && (n%10>=0 && n%10<=1) || (n%10>=5 && n%10<=9) || (n%100>=12 && n%100<=14) ? 2 : 3);}}}';
const GERMAN_TRANSLATIONS_FROM_ROOT = '\nexport default {"de":{"dictionary":{"Hello world":"Hallo Welt"},getPluralForm(n){return (n != 1);}}}';
const ENGLISH_TRANSLATIONS_FROM_ROOT = '\nexport default {"en":{"dictionary":{"Hello world":"Hello world"},"getPluralForm":null}}';

/**
 * Helper function for creating a bundle that won't be written to the file system.
 */
async function generateBundle( options?: RollupTranslationsOptions, banner?: string ): Promise<RollupOutput['output']> {
	const bundle = await rollup( {
		input: './tests/plugins/fixtures/input.js',
		plugins: [
			translations( options )
		]
	} );

	const { output } = await bundle.generate({ format: 'esm', banner });

	return output;
}

/**
 * Helper function for validating a translation file.
 */
function verifyOutputTranslations(
	output: RollupOutput['output'],
	filename: string,
	translations: string
): void {
	const translation = output.find( output => output.name === filename );

	expect( translation ).toBeDefined();
	expect( translation!.type ).toBe( 'chunk' );
	expect( ( translation as OutputChunk ).code ).toBe( translations );
}

/**
 * Test how the plugin behaves when no custom options are passed.
 */
test( 'default options', async () => {
	const output = await generateBundle();

	verifyOutputTranslations( output, 'translations/pl.js', ALL_POLISH_TRANSLATIONS );
	verifyOutputTranslations( output, 'translations/de.js', GERMAN_TRANSLATIONS_FROM_ROOT );
	verifyOutputTranslations( output, 'translations/en.js', ENGLISH_TRANSLATIONS_FROM_ROOT );
} );

/**
 * Ensure that the banner is added to the top of the generated bundle.
 */
test( 'banner', async () => {
	const banner = 'BANNER';
	const output = await generateBundle( undefined, banner );

	verifyOutputTranslations( output, 'translations/pl.js', banner + ALL_POLISH_TRANSLATIONS );
	verifyOutputTranslations( output, 'translations/de.js', banner + GERMAN_TRANSLATIONS_FROM_ROOT );
	verifyOutputTranslations( output, 'translations/en.js', banner + ENGLISH_TRANSLATIONS_FROM_ROOT );
} );

/**
 * Ensure that changing the `source` option affects which translation files are loaded.
 */
test( 'source', async () => {
	const output = await generateBundle( {
		source: './tests/plugins/fixtures/*.po'
	} );

	verifyOutputTranslations( output, 'translations/pl.js', POLISH_TRANSLATIONS_FROM_ROOT );
	verifyOutputTranslations( output, 'translations/de.js', GERMAN_TRANSLATIONS_FROM_ROOT );
	verifyOutputTranslations( output, 'translations/en.js', ENGLISH_TRANSLATIONS_FROM_ROOT );
} );

/**
 * Ensure that changing the `destination` option affects where the output translation files are placed.
 */
test( 'destination', async () => {
	const output = await generateBundle( {
		destination: 'languages'
	} );

	verifyOutputTranslations( output, 'languages/pl.js', ALL_POLISH_TRANSLATIONS );
	verifyOutputTranslations( output, 'languages/de.js', GERMAN_TRANSLATIONS_FROM_ROOT );
	verifyOutputTranslations( output, 'languages/en.js', ENGLISH_TRANSLATIONS_FROM_ROOT );
} );
