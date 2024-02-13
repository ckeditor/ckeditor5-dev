import { test, expect } from 'vitest';
import { getRollupOutputs, type Options } from '../../src/config.js';
import { join, relative } from 'path';

const defaults: Options = {
	input: '',
	tsconfig: '',
	external: [],
	browser: false,
	translations: false,
	sourceMap: false,
	bundle: false,
	minify: false
};

function getConfig( config: Partial<Options> = {} ) {
	return getRollupOutputs( Object.assign( {}, defaults, config ) );
}

function fixturePath( path: string ) {
	return relative(
		process.cwd(),
		join( import.meta.dirname, 'fixtures', path )
	);
}

test( '--input', async () => {
	const config = await getConfig( {
		input: './src/index.ts'
	} );

	expect( config.input ).toBe( process.cwd() + '/src/index.ts' );
} );

test( '--tsconfig', async () => {
	const fileExists = await getConfig( {
		tsconfig: fixturePath( 'tsconfig.fixture.json' )
	} );
	const fileDoesntExist = await getConfig( {
		tsconfig: fixturePath( 'tsconfig.non-existing.json' )
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
