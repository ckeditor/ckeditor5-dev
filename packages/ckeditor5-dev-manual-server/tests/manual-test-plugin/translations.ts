/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import { createManualTranslationsModule } from '../../src/manual-test-plugin/translations.js';

describe( 'createManualTranslationsModule()', () => {
	it( 'loads and registers translations from the configured package roots', () => {
		const source = createManualTranslationsModule( [ './packages/*', 'external/ckeditor5/packages/*/' ], 'ar' );

		expect( source ).to.contain( '"/packages/*/lang/translations/ar.ts"' );
		expect( source ).to.contain( '"/external/ckeditor5/packages/*/lang/translations/ar.ts"' );
		expect( source ).to.contain( 'Object.values( translationModules ).map( module => module[ language ] )' );
		expect( source ).to.contain( 'add( language, translation.dictionary, translation.getPluralForm )' );
	} );

	it( 'requires translations and a plural form for the selected language', () => {
		const source = createManualTranslationsModule( [ 'packages/*' ], 'pl' );

		expect( source ).to.contain( 'No CKEditor 5 translations found' );
		expect( source ).to.contain( 'The ckeditor5-core translations' );
	} );

	it( 'sets the default language for editors and contexts', () => {
		const source = createManualTranslationsModule( [ 'packages/*' ], 'ar' );

		expect( source ).to.contain( 'Editor.defaultConfig = { ...Editor.defaultConfig, language: "ar" }' );
		expect( source ).to.contain( 'Context.defaultConfig = { ...Context.defaultConfig, language: "ar" }' );
	} );
} );
