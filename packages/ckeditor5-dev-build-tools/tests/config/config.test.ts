/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { test, expect } from 'vitest';
import { getRolldownConfig } from '../../src/config.js';
import { mockGetUserDependency } from '../_utils/utils.js';
import type { OutputOptions, Plugin } from 'rolldown';

type Options = Parameters<typeof getRolldownConfig>[0];

const defaults: Options = {
	input: 'src/index.js',
	output: 'dist/index.js',
	tsconfig: '',
	banner: '',
	external: [],
	globals: [],
	declarations: false,
	translations: '',
	sourceMap: false,
	minify: false,
	logLevel: 'warn',
	clean: false,
	browser: false,
	name: '',
	cwd: ''
};

function getConfig( config: Partial<Options> = {} ): ReturnType<typeof getRolldownConfig> {
	return getRolldownConfig( Object.assign( {}, defaults, config ) );
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

	expect( ( fileExists.plugins as Array<Plugin> ).some( plugin => plugin?.name === 'emit-declaration-files' ) ).toBe( true );
	expect( ( fileDoesntExist.plugins as Array<Plugin> ).some( plugin => plugin?.name === 'emit-declaration-files' ) ).toBe( false );
	expect( ( declarationsFalse.plugins as Array<Plugin> ).some( plugin => plugin?.name === 'emit-declaration-files' ) ).toBe( false );

	expect( fileExists.tsconfig ).toBe( process.cwd() + '/tests/config/fixtures/tsconfig.fixture.json' );
	expect( fileDoesntExist.tsconfig ).toBeUndefined();
	expect( declarationsFalse.tsconfig ).toBe( process.cwd() + '/tests/config/fixtures/tsconfig.fixture.json' );
} );

test( '--external', async () => {
	const config = await getConfig( {
		external: [
			'foo',
			'socket.io-client'
		]
	} );

	// Exclude simple package names.
	expect( ( config.external as Function )( 'foo' ) ).toBe( true );

	// Exclude package names that contain a dot (which might be treated as a file extension).
	expect( ( config.external as Function )( 'socket.io-client' ) ).toBe( true );

	// Exclude packages with a code file extension (.ts, .js, .json, etc.).
	expect( ( config.external as Function )( 'socket.io-client/src/index.js' ) ).toBe( true );

	// Don't exclude CSS files.
	expect( ( config.external as Function )( 'socket.io-client/src/index.css' ) ).toBe( false );

	// Don't exclude SVG files.
	expect( ( config.external as Function )( 'socket.io-client/theme/icon.svg' ) ).toBe( false );

	// Don't exclude packages not listed in the "external" option.
	expect( ( config.external as Function )( 'bar' ) ).toBe( false );
} );

test( '--external automatically adds packages that make up the "ckeditor5"', async () => {
	await mockGetUserDependency(
		'ckeditor5/package.json',
		() => ( {
			name: 'ckeditor5',
			dependencies: {
				'@ckeditor/ckeditor5-core': '*',
				'@ckeditor/ckeditor5-code-block': '*'
			}
		} )
	);

	const config = await getConfig( {
		external: [ 'ckeditor5' ]
	} );

	expect( ( config.external as Function )( 'ckeditor5' ) ).toBe( true );
	expect( ( config.external as Function )( '@ckeditor/ckeditor5-core' ) ).toBe( true );
	expect( ( config.external as Function )( '@ckeditor/ckeditor5-code-block/theme/codeblock.css' ) ).toBe( false );
} );

test( '--external automatically adds packages that make up the "ckeditor5-premium-features"', async () => {
	await mockGetUserDependency(
		'ckeditor5-premium-features/package.json',
		() => ( {
			name: 'ckeditor5',
			dependencies: {
				'ckeditor5-collaboration': '*',
				'@ckeditor/ckeditor5-case-change': '*',
				'@ckeditor/ckeditor5-real-time-collaboration': '*'
			}
		} )
	);

	const config = await getConfig( {
		external: [ 'ckeditor5-premium-features' ]
	} );

	expect( ( config.external as Function )( 'ckeditor5-premium-features' ) ).toBe( true );
	expect( ( config.external as Function )( 'ckeditor5-collaboration' ) ).toBe( true );
	expect( ( config.external as Function )( '@ckeditor/ckeditor5-case-change' ) ).toBe( true );
	expect( ( config.external as Function )( '@ckeditor/ckeditor5-real-time-collaboration/theme/usermarkers.css' ) ).toBe( false );
} );

test( '--external rewrites CKEditor paths to aggregate packages in browser builds', async () => {
	await mockGetUserDependency(
		'ckeditor5/package.json',
		() => ( {
			name: 'ckeditor5',
			dependencies: {
				'@ckeditor/ckeditor5-core': '*'
			}
		} )
	);
	await mockGetUserDependency(
		'ckeditor5-premium-features/package.json',
		() => ( {
			name: 'ckeditor5-premium-features',
			dependencies: {
				'@ckeditor/ckeditor5-ai': '*',
				'ckeditor5-collaboration': '*'
			}
		} )
	);

	const config = await getConfig( {
		external: [
			'ckeditor5',
			'ckeditor5-premium-features'
		],
		browser: true
	} );

	const paths = ( config.output as OutputOptions ).paths as Function;

	expect( paths( '@ckeditor/ckeditor5-core' ) ).toBe( 'ckeditor5' );
	expect( paths( '@ckeditor/ckeditor5-ai' ) ).toBe( 'ckeditor5-premium-features' );
} );

test( '--external doesn\'t fail when "ckeditor5-premium-features" is not installed', async () => {
	await mockGetUserDependency(
		'ckeditor5-premium-features/package.json',
		() => {
			throw new Error( 'Cannot find module' );
		}
	);

	const config = await getConfig( {
		external: [ 'ckeditor5-premium-features' ]
	} );

	expect( ( config.external as Function )( 'ckeditor5-premium-features' ) ).toBe( true );
} );

test( '--translations', async () => {
	const withoutTranslations = await getConfig();
	const withTranslations = await getConfig( {
		translations: '**/*.po'
	} );

	expect( ( withoutTranslations.plugins as Array<Plugin> ).some( plugin => plugin?.name === 'cke5-translations' ) ).toBe( false );
	expect( ( withTranslations.plugins as Array<Plugin> ).some( plugin => plugin?.name === 'cke5-translations' ) ).toBe( true );
} );

test( '--minify', async () => {
	const withoutMinification = await getConfig();
	const withMinification = await getConfig( {
		minify: true
	} );

	expect( withoutMinification.output ).toMatchObject( { minify: false } );
	expect( withMinification.output ).toMatchObject( { minify: true } );
} );
