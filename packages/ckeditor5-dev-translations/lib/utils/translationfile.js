/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseSync } from 'oxc-parser';

const LICENSE_HEADER = `/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */`;

/**
 * Loads a generated TypeScript translation file.
 *
 * @param {string} filePath
 * @returns {Promise<{
 * language: string,
 * dictionary: Record<string, string|Array<string>>,
 * getPluralForm?: Function,
 * preamble: string,
 * translationsTypeImportSource: string
 * }>}
 */
export async function readTranslationFile( filePath ) {
	const content = fs.readFileSync( filePath, 'utf-8' );
	const { preamble, translationsTypeImportSource } = readTranslationFileMetadata( filePath, content );
	const { default: translations } = await import( pathToFileURL( filePath ).href );
	const languages = translations ? Object.keys( translations ) : [];

	if ( languages.length !== 1 ) {
		throw new Error( `Expected exactly one language in translation file: ${ filePath }.` );
	}

	const language = languages[ 0 ];
	const { dictionary, getPluralForm } = translations[ language ];

	return { language, dictionary, getPluralForm, preamble, translationsTypeImportSource };
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
 * @param {string} [options.preamble] Existing source preamble to preserve verbatim.
 * @returns {string}
 */
export function serializeTranslationFile( {
	language,
	dictionary,
	contexts,
	pluralFunction = null,
	skipLicenseHeader = false,
	translationsTypeImportSource = '@ckeditor/ckeditor5-utils',
	preamble
} ) {
	const lines = [];

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

	let filePreamble = preamble;

	if ( filePreamble === undefined ) {
		filePreamble = skipLicenseHeader ? '' : `${ LICENSE_HEADER }\n\n`;
	}

	return filePreamble + lines.join( '\n' );
}

function readTranslationFileMetadata( filePath, content ) {
	const { errors, module } = parseSync( filePath, content );

	if ( errors.length ) {
		throw new Error( `Could not parse translation file: ${ filePath }.` );
	}

	const translationsImport = module.staticImports.find( declaration => declaration.entries.some( entry => {
		return entry.isType &&
			entry.importName.kind === 'Name' &&
			entry.importName.name === 'Translations';
	} ) );

	if ( !translationsImport ) {
		throw new Error( `Missing Translations type import in translation file: ${ filePath }.` );
	}

	return {
		preamble: content.slice( 0, translationsImport.start ),
		translationsTypeImportSource: translationsImport.moduleRequest.value
	};
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
