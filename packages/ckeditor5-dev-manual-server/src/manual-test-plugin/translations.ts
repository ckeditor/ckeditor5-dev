/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { existsSync, globSync } from 'node:fs';
import { posix, resolve } from 'node:path';
import { stripLeadingSlash, toPosixPath, toPublicSpecifier } from '../utils.js';

export const MANUAL_TRANSLATIONS_VIRTUAL_ID: string = 'virtual:ckeditor5-manual-translations';
export const RESOLVED_MANUAL_TRANSLATIONS_VIRTUAL_ID: string = `\0${ MANUAL_TRANSLATIONS_VIRTUAL_ID }`;

/**
 * Creates the code of the module that registers the translations of the selected language.
 *
 * The translation files are found here and imported one by one, instead of with `import.meta.glob()`.
 * The bundled dev server watches the common base directory of all patterns of a glob import, with
 * everything below it. For package roots from different directories (for example `packages/*` and
 * `external/ckeditor5/packages/*`) that base is the workspace root, so the whole workspace would be
 * watched. A translation file added while the server is running is loaded after a server restart.
 */
export function createManualTranslationsModule( paths: Array<string>, language: string, workspaceRoot: string ): string {
	const translationFiles = collectTranslationFiles( paths, language, workspaceRoot );
	const imports = translationFiles.map( ( filePath, index ) => `import translations${ index } from ${ JSON.stringify( filePath ) };` );
	const importNames = translationFiles.map( ( filePath, index ) => `translations${ index }` );

	return `
import { add } from '@ckeditor/ckeditor5-utils';
import { Context, Editor } from '@ckeditor/ckeditor5-core';
${ imports.join( '\n' ) }

const translationModules = [ ${ importNames.join( ', ' ) } ];
const language = ${ JSON.stringify( language ) };
const translations = translationModules.map( module => module[ language ] );

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

/**
 * Returns the translation files of the selected language as specifiers relative to the workspace root,
 * for example `/packages/ckeditor5-foo/lang/translations/pl.ts`.
 *
 * The `patterns` are package root globs, for example `packages/*`.
 */
function collectTranslationFiles( patterns: Array<string>, language: string, workspaceRoot: string ): Array<string> {
	const translationFiles = patterns
		// Package roots are relative to the workspace root, also when they start with a slash.
		.map( pattern => stripLeadingSlash( toPosixPath( pattern ) ).replace( /\/+$/, '' ) )
		// Package roots are matched first, and the file is checked in each of them. A glob for the whole
		// file path would skip package directories that are symbolic links.
		.flatMap( pattern => globSync( pattern, { cwd: workspaceRoot } ) )
		.map( packageRoot => posix.join( toPosixPath( packageRoot ), `lang/translations/${ language }.ts` ) )
		.filter( filePath => existsSync( resolve( workspaceRoot, filePath ) ) )
		.map( filePath => toPublicSpecifier( filePath ) );

	// Overlapping package roots must not register the same translations twice.
	return [ ...new Set( translationFiles ) ].toSorted();
}
