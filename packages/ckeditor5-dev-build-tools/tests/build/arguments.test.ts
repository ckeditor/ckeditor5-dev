/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { test, expect, vi } from 'vitest';
import upath from 'upath';
import fs from 'node:fs';
import * as config from '../../src/config.js';
import { build } from '../../src/build.js';

/**
 * Mock `rollup`, so it doesn't try to build anything.
 */
vi.mock( 'rollup', () => ( {
	rollup() {
		return {
			write() {}
		};
	}
} ) );

/**
 * Mock `fs.rmSync`, so it doesn't try to delete anything.
 */
vi.mock( 'fs', () => ( {
	default: {
		rmSync() { }
	}
} ) );

/**
 * Mock function for generating rollup configuration.
 */
vi.mock( '../../src/config.ts', () => ( {
	getRollupConfig() {}
} ) );

/**
 * Returns spy for the `getRollupConfig` function.
 */
function getConfigMock() {
	return vi
		.spyOn( config, 'getRollupConfig' )
		.mockImplementationOnce( (): any => { } );
}

/**
 * Returns spy for the `fs.rmSync` function.
 */
function getRmMock() {
	return vi
		.spyOn( fs, 'rmSync' )
		.mockImplementationOnce( () => { } );
}

/**
 * Mocks arguments passed via the CLI.
 */
function mockCliArgs( ...args: Array<string> ) {
	vi.stubGlobal( 'process', {
		...process,
		argv: [ 'node', 'cli-command-name', ...args ]
	} );
}

/**
 * Returns an absolute path to the file.
 */
function getCwdPath( ...paths: Array<string> ) {
	return upath.resolve( process.cwd(), ...paths );
}

test( 'paths are normalized', async () => {
	const spy = getConfigMock();

	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( {
		input: upath.join( process.cwd(), '/src/index.ts' ),
		tsconfig: upath.join( process.cwd(), '/tsconfig.json' )
	} ) );
} );

/**
 * CLI arguments
 */

test( '--cwd', async () => {
	const spy = getConfigMock();

	mockCliArgs( '--cwd=/path/to/directory' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { input: getCwdPath( '/path/to/directory', 'src/index.ts' ) } ) );
} );

test( '--input', async () => {
	const spy = getConfigMock();

	mockCliArgs( '--input=main.js' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { input: getCwdPath( 'main.js' ) } ) );
} );

test( '--output', async () => {
	const spy = getConfigMock();

	mockCliArgs( '--output=dist/test.js' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { output: getCwdPath( 'dist/test.js' ) } ) );
} );

test( '--tsconfig', async () => {
	const spy = getConfigMock();

	mockCliArgs( '--tsconfig=tsconf.json' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { tsconfig: getCwdPath( 'tsconf.json' ) } ) );
} );

test( '--external', async () => {
	const spy = getConfigMock();

	mockCliArgs( '--external=foo', '--external=bar' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { external: [ 'foo', 'bar' ] } ) );
} );

test( '--globals', async () => {
	const spy = getConfigMock();

	mockCliArgs( '--globals=foo:bar', '--globals=baz:faz' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { globals: { foo: 'bar', baz: 'faz' } } ) );
} );

test( '--declarations', async () => {
	const spy = getConfigMock();

	mockCliArgs( '--declarations' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { declarations: true } ) );
} );

test( '--translations', async () => {
	const spy = getConfigMock();

	mockCliArgs( '--translations=translations/**/*.po' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { translations: getCwdPath( 'translations/**/*.po' ) } ) );
} );

test( '--source-map', async () => {
	const spy = getConfigMock();

	mockCliArgs( '--source-map' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { sourceMap: true } ) );
} );

test( '--minify', async () => {
	const spy = getConfigMock();

	mockCliArgs( '--minify' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { minify: true } ) );
} );

test( '--clean', async () => {
	const spy = getRmMock();

	mockCliArgs( '--clean' );
	await build();

	expect( spy ).toHaveBeenCalled();
} );

test( '--banner', async () => {
	const spy = getConfigMock();

	mockCliArgs( '--banner=tests/build/fixtures/src/banner.js' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { banner: '/*! TEST BANNER */' } ) );
} );

/**
 * Function arguments.
 */

test( '.input', async () => {
	const spy = getConfigMock();

	await build( { input: 'main.js' } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { input: getCwdPath( 'main.js' ) } ) );
} );

test( '.output', async () => {
	const spy = getConfigMock();

	await build( { input: 'dist/test.js' } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { input: getCwdPath( 'dist/test.js' ) } ) );
} );

test( '.tsconfig', async () => {
	const spy = getConfigMock();

	await build( { tsconfig: 'tsconf.json' } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { tsconfig: getCwdPath( 'tsconf.json' ) } ) );
} );

test( '.external', async () => {
	const spy = getConfigMock();

	await build( { external: [ 'foo', 'bar' ] } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { external: [ 'foo', 'bar' ] } ) );
} );

test( '.globals', async () => {
	const spy = getConfigMock();

	await build( { globals: { foo: 'bar' } } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { globals: { foo: 'bar' } } ) );
} );

test( '.globals (empty object)', async () => {
	const spy = getConfigMock();

	await build( { globals: {} } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { globals: {} } ) );
} );

test( '.rewrite', async () => {
	const spy = getConfigMock();

	await build( { rewrite: [ [ 'foo', 'bar' ] ] } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { rewrite: [ [ 'foo', 'bar' ] ] } ) );
} );

test( '.declarations', async () => {
	const spy = getConfigMock();

	await build( { declarations: true } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { declarations: true } ) );
} );

test( '.translations', async () => {
	const spy = getConfigMock();

	await build( { translations: 'translations/**/*.po' } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { translations: getCwdPath( 'translations/**/*.po' ) } ) );
} );

test( '.sourceMap', async () => {
	const spy = getConfigMock();

	await build( { sourceMap: true } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { sourceMap: true } ) );
} );

test( '.minify', async () => {
	const spy = getConfigMock();

	await build( { minify: true } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { minify: true } ) );
} );

test( '.clean', async () => {
	const spy = getRmMock();

	await build( { clean: true } );

	expect( spy ).toHaveBeenCalled();
} );

test( '.clean removes directory based on .output', async () => {
	const spy = getRmMock();

	await build( { output: 'custom/index.js', clean: true } );

	expect( spy ).toHaveBeenCalledWith(
		getCwdPath( 'custom' ),
		{ force: true, recursive: true }
	);
} );

test( '.banner', async () => {
	const spy = getConfigMock();

	await build( { banner: 'tests/build/fixtures/src/banner.js' } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { banner: '/*! TEST BANNER */' } ) );
} );
