import { test, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import * as rollup from 'rollup';
import * as config from '../../src/config.js';
import { build } from '../../src/build.js';

/**
 * Mock function for generating rollup configuration.
 */
const spy = vi
	.spyOn( config, 'getRollupOutputs' )
	.mockImplementation( (): any => {} );

/**
 * Mock `rollup`, so it doesn't try to build anything.
 */
const spyWrite = vi.fn();

vi
	.spyOn( rollup, 'rollup' )
	.mockResolvedValue( { write: spyWrite } as any );

/**
 * Mock `fs.rmSync`, so it doesn't try to delete anything.
 */
const spyRmSync = vi
	.spyOn( fs, 'rmSync' )
	.mockImplementation( () => {} );

/**
 * Mocks arguments passed via the CLI.
 */
function mockCliArgs( ...args: string[] ) {
	vi.stubGlobal( 'process', {
		...process,
		argv: [ 'node', 'cli-command-name', ...args ]
	} );
}

/**
 * Returns an absolute path to the file.
 */
function path( fileName: string ) {
	return process.cwd() + fileName;
}

beforeEach( () => {
	vi.clearAllMocks();
} );

test( 'paths are normalized', async () => {
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( {
		input: process.cwd() + '/src/index.ts',
		tsconfig: process.cwd() + '/tsconfig.json'
	} ) );
} )

/**
 * CLI arguments
 */

test( '--input', async () => {
	mockCliArgs( '--input=main.js' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { input: path( '/main.js' ) } ) );
} );

test( '--tsconfig', async () => {
	mockCliArgs( '--tsconfig=tsconf.json' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { tsconfig: path( '/tsconf.json' ) } ) );
} );

test( '--external', async () => {
	mockCliArgs( '--external=foo', '--external=bar' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { external: [ 'foo', 'bar' ] } ) );
} );

test( '--browser', async () => {
	mockCliArgs( '--browser' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { browser: true } ) );
} );

test( '--translations', async () => {
	mockCliArgs( '--translations' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { translations: true } ) );
} );

test( '--source-map', async () => {
	mockCliArgs( '--source-map' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { sourceMap: true } ) );
} );

test( '--bundle', async () => {
	mockCliArgs( '--bundle' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { bundle: true } ) );
} );

test( '--minify', async () => {
	mockCliArgs( '--minify' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { minify: true } ) );
} );

test( '--clean', async () => {
	mockCliArgs( '--clean' );
	await build();

	expect( spyRmSync ).toHaveBeenCalled();
} );

test( '--banner', async () => {
	spyWrite.mockClear();

	mockCliArgs( '--banner=tests/build/fixtures/src/banner.js' );
	await build();

	expect( spyWrite ).toHaveBeenCalledWith( expect.objectContaining( { banner: '// TEST BANNER' } ) );
} );

/**
 * Function arguments.
 */

test( '.input', async () => {
	await build( { input: 'main.js' } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { input: path( '/main.js' ) } ) );
} );

test( '.tsconfig', async () => {
	await build( { tsconfig: 'tsconf.json' } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { tsconfig: path( '/tsconf.json' ) } ) );
} );

test( '.external', async () => {
	await build( { external: [ 'foo', 'bar' ] } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { external: [ 'foo', 'bar' ] } ) );
} );

test( '.browser', async () => {
	await build( { browser: true } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { browser: true } ) );
} );

test( '.translations', async () => {
	await build( { translations: true } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { translations: true } ) );
} );

test( '.sourceMap', async () => {
	await build( { sourceMap: true } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { sourceMap: true } ) );
} );

test( '.bundle', async () => {
	await build( { bundle: true } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { bundle: true } ) );
} );

test( '.minify', async () => {
	await build( { minify: true } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { minify: true } ) );
} );

test( '.clean', async () => {
	await build( { clean: true } );

	expect( spyRmSync ).toHaveBeenCalled();
} );

test( '.banner', async () => {
	await build( { banner: 'tests/build/fixtures/src/banner.js' } );

	expect( spyWrite ).toHaveBeenCalledWith( expect.objectContaining( { banner: '// TEST BANNER' } ) );
} );
