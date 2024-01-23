/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import { parse } from 'path';
import { readFileSync } from 'fs';

import path from 'upath';
import PO from 'pofile';
import { groupBy, merge } from 'lodash-es';
import { glob } from 'glob';
import type { Plugin, NormalizedOutputOptions, OutputBundle, OutputChunk } from 'rollup';

export interface RollupTranslationsOptions {
	/**
	 * The [glob](https://github.com/isaacs/node-glob) compatible path to the `.po` files.
	 *
	 * @default '**\/*.po'
	 */
	source?: string;

	/**
	 * The name of the directory to output all translations to.
	 * 
	 * @default 'translations'
	 */
	destination?: string;
}

interface Translation {
	dictionary: Record<string, string | string[]>;
	getPluralForm: string | null;
}

/**
 * Returns translations dictionary from the PO file.
 */
function getDictionary( content: PO ): Translation['dictionary'] {
	const dictionary: Translation['dictionary'] = {};

	for ( const { msgid, msgstr } of content.items ) {
		dictionary[ msgid ] = msgstr.length === 1 ? msgstr[ 0 ]! : msgstr;
	}

	return dictionary;
}

/**
 * Returns stringified pluralization function from the PO file.
 */
function getPluralFunction( content: PO ): string | null {
	return content.headers[ 'Plural-Forms' ]?.split( 'plural=' )?.[ 1 ] ?? null;
}

/**
 * Returns the code of the output translations file.
 */
function getCode(
	language: string,
	translation: Translation,
	banner: string
): string {
	let translations = JSON.stringify({
		[ language ]: translation
	} );

	translations = translations.replace(
		/"getPluralForm":"(.*)"/,
		"getPluralForm(n){return $1}"
	);

	return banner + '\n' + 'export default ' + translations;
}

/**
 * Generates translation files from the `.po` files.
 */
export function translations(pluginOptions?: RollupTranslationsOptions): Plugin {
	const options: Required<RollupTranslationsOptions> = Object.assign( {
		source: '**\/*.po',
		destination: 'translations'
	}, pluginOptions || {} );

	return {
		name: 'cke5-po2js',

		async generateBundle( output: NormalizedOutputOptions, bundle: OutputBundle ) {
			// Get `banner` from the Rollup configuration object.
			const mainChunk = Object
				.values( bundle )
				.filter( ( output ): output is OutputChunk => output.type === 'chunk' )
				.find( chunk => chunk.isEntry )!;

			const banner = await output.banner( mainChunk );

			// Get the paths to the PO files based on provided pattern.
			const filePaths = await glob( options.source, { ignore: 'node_modules/**' } );

			// Group the translation files by the language code.
			const grouped = groupBy( filePaths, path => parse( path ).name );

			for ( const [ language, paths ] of Object.entries( grouped ) ) {
				// Gather all translations for the given language.
				const translations: Translation[] = paths
					.map( path => readFileSync( path, 'utf-8' ) )
					.map( PO.parse )
					.filter( Boolean )
					.map( content => ({
						dictionary: getDictionary( content ),
						getPluralForm: getPluralFunction( content )
					}) );

				// Merge all translations into a single object.
				const translation = merge( {}, ...translations );

				// Emit translation file for the current language.
				this.emitFile( {
					type: 'prebuilt-chunk',
					fileName: path.join( options.destination, `${ language }.js` ),
					code: getCode( language, translation, banner ),
					exports: [ 'default' ]
				} )
			}
		}
	}
}
