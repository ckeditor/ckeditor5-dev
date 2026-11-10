/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { mkdir, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createManualTranslationsModule } from '../../src/manual-test-plugin/translations.js';
import { createFile, createTemporaryDirectory, removeDirectory } from '../_utils/files.js';

describe( 'createManualTranslationsModule()', () => {
	let workspaceRoot: string;

	beforeEach( async () => {
		workspaceRoot = await createTemporaryDirectory( 'ckeditor5-manual-translations-' );
	} );

	afterEach( async () => {
		await removeDirectory( workspaceRoot );
	} );

	it( 'imports and registers translations from the configured package roots', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/lang/translations/ar.ts' ),
			createFile( workspaceRoot, 'external/ckeditor5/packages/ckeditor5-bar/lang/translations/ar.ts' )
		] );

		const source = createManualTranslationsModule( [ './packages/*', 'external/ckeditor5/packages/*/' ], 'ar', workspaceRoot );

		expect( source ).to.contain( 'import translations0 from "/external/ckeditor5/packages/ckeditor5-bar/lang/translations/ar.ts";' );
		expect( source ).to.contain( 'import translations1 from "/packages/ckeditor5-foo/lang/translations/ar.ts";' );
		expect( source ).to.contain( 'const translationModules = [ translations0, translations1 ];' );
		expect( source ).to.contain( 'translationModules.map( module => module[ language ] )' );
		expect( source ).to.contain( 'add( language, translation.dictionary, translation.getPluralForm )' );
	} );

	it( 'imports only the translations of the selected language', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/lang/translations/pl.ts' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/lang/translations/en.ts' ),
			createFile( workspaceRoot, 'packages/ckeditor5-bar/lang/translations/en.ts' )
		] );

		const source = createManualTranslationsModule( [ 'packages/*' ], 'pl', workspaceRoot );

		expect( source ).to.contain( '/packages/ckeditor5-foo/lang/translations/pl.ts' );
		expect( source ).not.to.contain( 'lang/translations/en.ts' );
		expect( source ).not.to.contain( 'ckeditor5-bar' );
	} );

	it( 'imports a translation file once when package roots overlap', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/lang/translations/pl.ts' ),
			createFile( workspaceRoot, 'packages/ckeditor5-bar/lang/translations/pl.ts' )
		] );

		const source = createManualTranslationsModule( [ 'packages/*', 'packages/ckeditor5-foo' ], 'pl', workspaceRoot );

		expect( source ).to.contain( 'const translationModules = [ translations0, translations1 ];' );
		expect( source.split( '/packages/ckeditor5-foo/lang/translations/pl.ts' ) ).to.have.length( 2 );
	} );

	it( 'treats package roots that start with a slash as relative to the workspace root', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/lang/translations/pl.ts' );

		const source = createManualTranslationsModule( [ '/packages/*' ], 'pl', workspaceRoot );

		expect( source ).to.contain( 'import translations0 from "/packages/ckeditor5-foo/lang/translations/pl.ts";' );
	} );

	it( 'imports translations from a package directory that is a symbolic link', async () => {
		await createFile( workspaceRoot, 'linked/ckeditor5-foo/lang/translations/pl.ts' );
		await mkdir( join( workspaceRoot, 'packages' ) );
		await symlink( join( workspaceRoot, 'linked/ckeditor5-foo' ), join( workspaceRoot, 'packages/ckeditor5-foo' ), 'dir' );

		const source = createManualTranslationsModule( [ 'packages/*' ], 'pl', workspaceRoot );

		expect( source ).to.contain( 'import translations0 from "/packages/ckeditor5-foo/lang/translations/pl.ts";' );
	} );

	it( 'does not use a glob import, which would make the dev server watch the base directory of the patterns', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/lang/translations/pl.ts' );

		const source = createManualTranslationsModule( [ 'packages/*' ], 'pl', workspaceRoot );

		expect( source ).not.to.contain( 'import.meta.glob' );
	} );

	it( 'imports nothing when no translation file is found', () => {
		const source = createManualTranslationsModule( [ 'packages/*' ], 'pl', workspaceRoot );

		expect( source ).to.contain( 'const translationModules = [  ];' );
	} );

	it( 'requires translations and a plural form for the selected language', () => {
		const source = createManualTranslationsModule( [ 'packages/*' ], 'pl', workspaceRoot );

		expect( source ).to.contain( 'No CKEditor 5 translations found' );
		expect( source ).to.contain( 'The ckeditor5-core translations' );
	} );

	it( 'sets the default language for editors and contexts', () => {
		const source = createManualTranslationsModule( [ 'packages/*' ], 'ar', workspaceRoot );

		expect( source ).to.contain( 'Editor.defaultConfig = { ...Editor.defaultConfig, language: "ar" }' );
		expect( source ).to.contain( 'Context.defaultConfig = { ...Context.defaultConfig, language: "ar" }' );
	} );
} );
