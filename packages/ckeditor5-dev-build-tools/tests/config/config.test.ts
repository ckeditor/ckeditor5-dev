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
	bundle: false,
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
		tsconfig: process.cwd() + '/tests/config/fixtures/tsconfig.fixture.json'
	} );
	const fileDoesntExist = await getConfig( {
		tsconfig: process.cwd() + '/tests/config/fixtures/tsconfig.non-existing.json'
	} );

	expect( fileDoesntExist.plugins.some( plugin => plugin?.name === 'typescript' ) ).toBe( false );
	expect( fileExists.plugins.some( plugin => plugin?.name === 'typescript' ) ).toBe( true );
} );

test( '--external', async () => {
	const config = await getConfig( {
		external: [ 'foo' ]
	} );

	expect( config.external( 'foo' ) ).toBe( true );
	expect( config.external( 'bar' ) ).toBe( false );
} );

test( '--bundle', async () => {
	const config = await getConfig( {
		external: [ 'foo' ],
		bundle: true
	} );

	expect( config.external( 'foo' ) ).toBe( false );
	expect( config.external( 'bar' ) ).toBe( false );
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
