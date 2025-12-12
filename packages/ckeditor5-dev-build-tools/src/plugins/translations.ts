/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parse } from 'node:path';
import { readFileSync } from 'node:fs';

import path from 'upath';
import PO from 'pofile';
import { groupBy, merge } from 'es-toolkit/compat';
import { glob } from 'glob';
import type { Plugin } from 'rollup';
import { removeWhitespace } from '../utils.js';

const TYPINGS = removeWhitespace( `
	import type { Translations } from '@ckeditor/ckeditor5-utils';

	declare const translations: Translations;
	export default translations;
` );

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
	dictionary: Record<string, string | Array<string>>;
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
 * Returns the code of the translations.
 */
function getCode( language: string, translation: Translation ): string {
	const translations = JSON.stringify( {
		[ language ]: translation
	} );

	return translations.replace(
		/"getPluralForm":"(.*)"/,
		'getPluralForm(n){return $1}'
	);
}

/**
 * Outputs the code for the ESM translation file.
 */
function getEsmCode( code: string ): string {
	return `export default ${ code }`;
}

/**
 * Outputs the code for the UMD translation file.
 */
function getUmdCode( language: string, code: string ): string {
	return removeWhitespace( `
		( e => {
			const { [ '${ language }' ]: { dictionary, getPluralForm } } = ${ code };

			e[ '${ language }' ] ||= { dictionary: {}, getPluralForm: null };
			e[ '${ language }' ].dictionary = Object.assign( e[ '${ language }' ].dictionary, dictionary );
			e[ '${ language }' ].getPluralForm = getPluralForm;
		} )( window.CKEDITOR_TRANSLATIONS ||= {} );
	` );
}

/**
 * Generates translation files from the `.po` files.
 */
export function translations( pluginOptions?: RollupTranslationsOptions ): Plugin {
	const options: Required<RollupTranslationsOptions> = Object.assign( {
		source: '**/*.po',
		destination: 'translations'
	}, pluginOptions || {} );

	return {
		name: 'cke5-translations',

		async generateBundle() {
			// Get the paths to the PO files based on provided pattern.
			const filePaths = await glob( options.source, {
				cwd: process.cwd(),
				ignore: 'node_modules/**'
			} );

			// Group the translation files by the language code.
			const grouped = groupBy( filePaths, path => parse( path ).name );

			for ( const [ language, paths ] of Object.entries( grouped ) ) {
				// Gather all translations for the given language.
				const translations: Array<Translation> = paths
					// Resolve relative paths to absolute paths.
					.map( filePath => path.isAbsolute( filePath ) ? filePath : path.join( process.cwd(), filePath ) )
					// Load files by path.
					.map( filePath => readFileSync( filePath, 'utf-8' ) )
					// Process `.po` files.
					.map( PO.parse )
					// Filter out empty files.
					.filter( Boolean )
					// Map files to desired structure.
					.map( content => ( {
						dictionary: getDictionary( content ),
						getPluralForm: getPluralFunction( content )
					} ) );

				// Merge all translations into a single object.
				const translation = merge( {}, ...translations );

				const code = getCode( language, translation );

				// Emit ESM translations file.
				this.emitFile( {
					type: 'prebuilt-chunk',
					fileName: path.join( options.destination, `${ language }.js` ),
					code: getEsmCode( code ),
					exports: [ 'default' ]
				} );

				// Emit UMD translations file.
				this.emitFile( {
					type: 'prebuilt-chunk',
					fileName: path.join( options.destination, `${ language }.umd.js` ),
					code: getUmdCode( language, code ),
					exports: []
				} );

				// Emit typings file.
				this.emitFile( {
					type: 'prebuilt-chunk',
					fileName: path.join( options.destination, `${ language }.d.ts` ),
					code: TYPINGS,
					exports: []
				} );
			}
		}
	};
}
