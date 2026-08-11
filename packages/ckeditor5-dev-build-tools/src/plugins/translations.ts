/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parse } from 'node:path';
import { pathToFileURL } from 'node:url';
import path from 'upath';
import { groupBy, merge } from 'es-toolkit/compat';
import { glob } from 'glob';
import type { Plugin } from 'rolldown';
import { removeWhitespace } from '../utils.js';

const TYPINGS = removeWhitespace( `
	import type { Translations } from '@ckeditor/ckeditor5-utils';

	declare const translations: Translations;
	export default translations;
` );

export interface RollupTranslationsOptions {

	/**
	 * The [glob](https://github.com/isaacs/node-glob) compatible path to the TypeScript translation files.
	 *
	 * @default '**\/lang\/translations\/*.ts'
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
	getPluralForm?: ( n: number ) => number | boolean;
}

/**
 * Returns the code of the translations.
 */
function getCode( language: string, translation: Translation ): string {
	const dictionary = JSON.stringify( translation.dictionary );
	const pluralFunction = translation.getPluralForm ?
		`,"getPluralForm":${ translation.getPluralForm.toString().replaceAll( /\s+/g, ' ' ) }` : '';

	return `{${ JSON.stringify( language ) }:{"dictionary":${ dictionary }${ pluralFunction }}}`;
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
			const { [ '${ language }' ]: translations } = ${ code };

			e[ '${ language }' ] ||= { dictionary: {}, getPluralForm: null };
			e[ '${ language }' ].dictionary = Object.assign( e[ '${ language }' ].dictionary, translations.dictionary );

			if ( translations.getPluralForm ) {
				e[ '${ language }' ].getPluralForm = translations.getPluralForm;
			}
		} )( window.CKEDITOR_TRANSLATIONS ||= {} );
	` );
}

/**
 * Generates distributable translation files from TypeScript translation sources.
 */
export function translations( pluginOptions?: RollupTranslationsOptions ): Plugin {
	const options: Required<RollupTranslationsOptions> = Object.assign( {
		source: '**/lang/translations/*.ts',
		destination: 'translations'
	}, pluginOptions || {} );

	return {
		name: 'cke5-translations',

		async generateBundle() {
			// Get the paths to the translation files based on provided pattern.
			const filePaths = ( await glob( options.source, {
				cwd: process.cwd(),
				ignore: [ 'node_modules/**', '**/dist/**', '**/*.d.ts' ]
			} ) ).filter( filePath => {
				const pathSegments = filePath.split( /[/\\]/ );

				return !filePath.endsWith( '.d.ts' ) && !pathSegments.includes( 'dist' ) && !pathSegments.includes( 'node_modules' );
			} );

			// Group the translation files by the language code.
			const grouped = groupBy( filePaths, path => parse( path ).name );

			for ( const [ language, paths ] of Object.entries( grouped ) ) {
				// Gather all translations for the given language.
				const translations: Array<Translation> = await Promise.all( paths
					// Resolve relative paths to absolute paths.
					.map( filePath => path.isAbsolute( filePath ) ? filePath : path.join( process.cwd(), filePath ) )
					// Load TypeScript modules and select the translation matching the file name.
					.map( async filePath => {
						const translationModule = await import( pathToFileURL( filePath ).href );

						return translationModule.default[ language ] as Translation;
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
