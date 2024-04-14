/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { test, expect, vi } from 'vitest';
import fs from 'fs';
import * as rollup from 'rollup';
import * as config from '../../src/config.js';
import { build } from '../../src/build.js';

/**
 * Mock `rollup`, so it doesn't try to build anything.
 */
vi
	.spyOn( rollup, 'rollup' )
	.mockResolvedValue( { write() { } } as any );

/**
 * Mock function for generating rollup configuration.
 */
const spy = vi
	.spyOn( config, 'getRollupConfig' )
	.mockImplementation( (): any => {} );

/**
 * Mock `fs.rmSync`, so it doesn't try to delete anything.
 */
const spyRmSync = vi
	.spyOn( fs, 'rmSync' )
	.mockImplementation( () => {} );

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
function getCwdPath( fileName: string ) {
	return process.cwd() + fileName;
}

test( 'paths are normalized', async () => {
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( {
		input: process.cwd() + '/src/index.ts',
		tsconfig: process.cwd() + '/tsconfig.json'
	} ) );
} );

/**
 * CLI arguments
 */

test( '--input', async () => {
	mockCliArgs( '--input=main.js' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { input: getCwdPath( '/main.js' ) } ) );
} );

test( '--output', async () => {
	mockCliArgs( '--output=dist/test.js' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { output: getCwdPath( '/dist/test.js' ) } ) );
} );

test( '--tsconfig', async () => {
	mockCliArgs( '--tsconfig=tsconf.json' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { tsconfig: getCwdPath( '/tsconf.json' ) } ) );
} );

test( '--external', async () => {
	mockCliArgs( '--external=foo', '--external=bar' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { external: [ 'foo', 'bar' ] } ) );
} );

test( '--declarations', async () => {
	mockCliArgs( '--declarations' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { declarations: true } ) );
} );

test( '--translations', async () => {
	mockCliArgs( '--translations=translations/**/*.po' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { translations: getCwdPath( '/translations/**/*.po' ) } ) );
} );

test( '--source-map', async () => {
	mockCliArgs( '--source-map' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { sourceMap: true } ) );
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
	mockCliArgs( '--banner=tests/build/fixtures/src/banner.js' );
	await build();

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { banner: '/*! TEST BANNER */' } ) );
} );

/**
 * Function arguments.
 */

test( '.input', async () => {
	await build( { input: 'main.js' } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { input: getCwdPath( '/main.js' ) } ) );
} );

test( '.output', async () => {
	await build( { input: 'dist/test.js' } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { input: getCwdPath( '/dist/test.js' ) } ) );
} );

test( '.tsconfig', async () => {
	await build( { tsconfig: 'tsconf.json' } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { tsconfig: getCwdPath( '/tsconf.json' ) } ) );
} );

test( '.external', async () => {
	await build( { external: [ 'foo', 'bar' ] } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { external: [ 'foo', 'bar' ] } ) );
} );

test( '.rewrite', async () => {
	await build( { rewrite: [ [ 'foo', 'bar' ] ] } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { rewrite: [ [ 'foo', 'bar' ] ] } ) );
} );

test( '.declarations', async () => {
	await build( { declarations: true } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { declarations: true } ) );
} );

test( '.translations', async () => {
	await build( { translations: 'translations/**/*.po' } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { translations: getCwdPath( '/translations/**/*.po' ) } ) );
} );

test( '.sourceMap', async () => {
	await build( { sourceMap: true } );

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { sourceMap: true } ) );
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

	expect( spy ).toHaveBeenCalledWith( expect.objectContaining( { banner: '/*! TEST BANNER */' } ) );
} );
