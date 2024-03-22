/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { test, expect } from 'vitest';
import { getRollupConfig } from '../../src/config.js';

type Options = Parameters<typeof getRollupConfig>[0];

const defaults: Options = {
	input: 'src/index.js',
	output: 'dist/index.js',
	tsconfig: '',
	banner: '',
	external: [],
	declarations: false,
	translations: false,
	sourceMap: false,
	minify: false,
	clean: false
};

function getConfig( config: Partial<Options> = {} ) {
	return getRollupConfig( Object.assign( {}, defaults, config ) );
}

test( '--input', async () => {
	const input = process.cwd() + '/src/main.ts';
	const config = await getConfig( { input } );

	expect( config.input ).toBe( input );
} );

test( '--tsconfig', async () => {
	const fileExists = await getConfig( {
		tsconfig: process.cwd() + '/tests/config/fixtures/tsconfig.fixture.json',
		declarations: true
	} );
	const fileDoesntExist = await getConfig( {
		tsconfig: process.cwd() + '/tests/config/fixtures/tsconfig.non-existing.json',
		declarations: true
	} );
	const declarationsFalse = await getConfig( {
		tsconfig: process.cwd() + '/tests/config/fixtures/tsconfig.fixture.json',
		declarations: false
	} );

	expect( fileExists.plugins.some( plugin => plugin?.name === 'typescript' ) ).toBe( true );
	expect( fileDoesntExist.plugins.some( plugin => plugin?.name === 'typescript' ) ).toBe( false );
	expect( declarationsFalse.plugins.some( plugin => plugin?.name === 'typescript' ) ).toBe( false );
} );

test( '--external', async () => {
	const config = await getConfig( {
		external: [ 'foo' ]
	} );

	expect( config.external.includes( 'foo' ) ).toBe( true );
	expect( config.external.includes( 'bar' ) ).toBe( false );
} );

test( '--external automatically adds packages that make up the "ckeditor5" and "ckeditor5-premium-features"', async () => {
	const config1 = await getConfig( {
		external: [ 'ckeditor5' ]
	} );

	const config2 = await getConfig( {
		external: [ 'ckeditor5-premium-features' ]
	} );

	expect( config1.external.includes( 'ckeditor5' ) ).toBe( true );
	expect( config1.external.includes( '@ckeditor/ckeditor5-core' ) ).toBe( true );

	expect( config2.external.includes( 'ckeditor5-premium-features' ) ).toBe( true );
	expect( config2.external.includes( '@ckeditor/ckeditor5-case-change' ) ).toBe( true );
} );

test( '--translations', async () => {
	const withoutTranslations = await getConfig();
	const withTranslations = await getConfig( {
		translations: true
	} );

	expect( withoutTranslations.plugins.some( plugin => plugin?.name === 'cke5-translations' ) ).toBe( false );
	expect( withTranslations.plugins.some( plugin => plugin?.name === 'cke5-translations' ) ).toBe( true );
} );

test( '--minify', async () => {
	const withoutMinification = await getConfig();
	const withMinification = await getConfig( {
		minify: true
	} );

	expect( withoutMinification.plugins.some( plugin => plugin?.name === 'terser' ) ).toBe( false );
	expect( withMinification.plugins.some( plugin => plugin?.name === 'terser' ) ).toBe( true );
} );
