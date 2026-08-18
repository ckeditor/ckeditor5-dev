/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { posix } from 'node:path';
import { toPosixPath } from '../utils.js';

export const MANUAL_TRANSLATIONS_VIRTUAL_ID: string = 'virtual:ckeditor5-manual-translations';
export const RESOLVED_MANUAL_TRANSLATIONS_VIRTUAL_ID: string = `\0${ MANUAL_TRANSLATIONS_VIRTUAL_ID }`;

/**
 * Generates the virtual module that loads translations from every configured package root.
 */
export function createManualTranslationsModule( paths: Array<string>, language: string ): string {
	const translationPatterns = paths.map( packagePath => {
		return posix.join( '/', toPosixPath( packagePath ), `lang/translations/${ language }.ts` );
	} );

	return `
import { add } from '@ckeditor/ckeditor5-utils';
import { Context, Editor } from '@ckeditor/ckeditor5-core';

const translationModules = import.meta.glob(
	${ JSON.stringify( translationPatterns ) },
	{ eager: true, import: 'default' }
);
const language = ${ JSON.stringify( language ) };
const translations = Object.values( translationModules ).map( module => module[ language ] );

if ( !translations.length ) {
	throw new Error( \`No CKEditor 5 translations found for "\${ language }".\` );
}

if ( !translations.some( translation => translation.getPluralForm ) ) {
	throw new Error( \`The ckeditor5-core translations for "\${ language }" were not loaded.\` );
}

for ( const translation of translations ) {
	add( language, translation.dictionary, translation.getPluralForm );
}

Editor.defaultConfig = { ...Editor.defaultConfig, language: ${ JSON.stringify( language ) } };
Context.defaultConfig = { ...Context.defaultConfig, language: ${ JSON.stringify( language ) } };`;
}
