/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { pathToFileURL } from 'node:url';

const LICENSE_HEADER = `/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */`;

/**
 * Loads a generated TypeScript translation file.
 *
 * @param {string} filePath
 * @returns {Promise<{ language: string, dictionary: Record<string, string|Array<string>>, getPluralForm?: Function }>}
 */
export async function readTranslationFile( filePath ) {
	const { default: translations } = await import( pathToFileURL( filePath ).href );
	const languages = Object.keys( translations );

	if ( languages.length !== 1 ) {
		throw new Error( `Expected exactly one language in translation file: ${ filePath }.` );
	}

	const language = languages[ 0 ];
	const { dictionary, getPluralForm } = translations[ language ];

	return { language, dictionary, getPluralForm };
}

/**
 * Serializes a translation dictionary as a typechecked TypeScript module.
 *
 * @param {object} options
 * @param {string} options.language
 * @param {Record<string, string|Array<string>>} options.dictionary
 * @param {Record<string, string>} options.contexts
 * @param {string|null} [options.pluralFunction]
 * @param {boolean} [options.skipLicenseHeader]
 * @param {string} [options.translationsTypeImportSource]
 * @returns {string}
 */
export function serializeTranslationFile( {
	language,
	dictionary,
	contexts,
	pluralFunction = null,
	skipLicenseHeader = false,
	translationsTypeImportSource = '@ckeditor/ckeditor5-utils'
} ) {
	const lines = [];

	if ( !skipLicenseHeader ) {
		lines.push( LICENSE_HEADER, '' );
	}

	lines.push(
		`import type { Translations } from ${ quote( translationsTypeImportSource ) };`,
		'',
		'const translations: Translations = {',
		`\t${ quote( language ) }: {`,
		'\t\tdictionary: {'
	);

	const entries = Object.keys( contexts )
		.filter( messageId => Object.hasOwn( dictionary, messageId ) );

	entries.forEach( ( messageId, index ) => {
		const context = contexts[ messageId ];

		for ( const line of context.split( /\r?\n/ ) ) {
			lines.push( `\t\t\t// ${ line }` );
		}

		const suffix = index === entries.length - 1 ? '' : ',';
		lines.push( `\t\t\t${ quote( messageId ) }: ${ serializeValue( dictionary[ messageId ] ) }${ suffix }` );
	} );

	lines.push( '\t\t}' );

	if ( pluralFunction ) {
		lines[ lines.length - 1 ] += ',';
		lines.push( `\t\tgetPluralForm: ( n: number ) => ${ pluralFunction }` );
	}

	lines.push( '\t}', '};', '', 'export default translations;', '' );

	return lines.join( '\n' );
}

function serializeValue( value ) {
	if ( Array.isArray( value ) ) {
		return `[ ${ value.map( quote ).join( ', ' ) } ]`;
	}

	return quote( value );
}

function quote( value ) {
	return `'${ value
		.replace( /\\/g, '\\\\' )
		.replace( /'/g, '\\\'' )
		.replace( /\r/g, '\\r' )
		.replace( /\n/g, '\\n' )
		.replace( /\u2028/g, '\\u2028' )
		.replace( /\u2029/g, '\\u2029' ) }'`;
}
