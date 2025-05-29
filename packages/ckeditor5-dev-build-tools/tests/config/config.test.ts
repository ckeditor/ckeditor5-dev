/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { test, expect } from 'vitest';
import { getRollupConfig } from '../../src/config.js';
import { mockGetUserDependency } from '../_utils/utils.js';

type Options = Parameters<typeof getRollupConfig>[0];

const defaults: Options = {
	input: 'src/index.js',
	output: 'dist/index.js',
	tsconfig: '',
	banner: '',
	external: [],
	rewrite: [],
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
		external: [
			'foo',
			'socket.io-client'
		]
	} );

	// Exclude simple package names.
	expect( config.external( 'foo' ) ).toBe( true );

	// Exclude package names that contain a dot (which might be treated as a file extension).
	expect( config.external( 'socket.io-client' ) ).toBe( true );

	// Exclude packages with a code file extension (.ts, .js, .json, etc.).
	expect( config.external( 'socket.io-client/src/index.js' ) ).toBe( true );

	// Don't exclude CSS files.
	expect( config.external( 'socket.io-client/src/index.css' ) ).toBe( false );

	// Don't exclude SVG files.
	expect( config.external( 'socket.io-client/theme/icon.svg' ) ).toBe( false );

	// Don't exclude packages not listed in the "external" option.
	expect( config.external( 'bar' ) ).toBe( false );
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

	expect( config.external( 'ckeditor5' ) ).toBe( true );
	expect( config.external( 'ckeditor5/src/ui.js' ) ).toBe( true );
	expect( config.external( '@ckeditor/ckeditor5-core' ) ).toBe( true );
	expect( config.external( '@ckeditor/ckeditor5-code-block/theme/codeblock.css' ) ).toBe( false );
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

	expect( config.external( 'ckeditor5-premium-features' ) ).toBe( true );
	expect( config.external( 'ckeditor5-collaboration/src/collaboration-core.js' ) ).toBe( true );
	expect( config.external( '@ckeditor/ckeditor5-case-change' ) ).toBe( true );
	expect( config.external( '@ckeditor/ckeditor5-real-time-collaboration/theme/usermarkers.css' ) ).toBe( false );
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

	expect( config.external( 'ckeditor5-premium-features' ) ).toBe( true );
} );

test( '--translations', async () => {
	const withoutTranslations = await getConfig();
	const withTranslations = await getConfig( {
		translations: '**/*.po'
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
