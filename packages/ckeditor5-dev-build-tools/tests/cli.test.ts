import { test, expect, vi } from 'vitest';
import fs from 'fs';
import * as rollup from 'rollup';
import * as config from '../src/config.js';
import { banner, buildProject } from '../src/cli.js';

/**
 * Mock `rollup`, so it doesn't try to build anything.
 */
const spyRollupWrite = vi.fn();

vi
	.spyOn( rollup, 'rollup' )
	.mockResolvedValue( { write: spyRollupWrite } as any );

/**
 * Mock `fs.rmSync`, so it doesn't try to delete anything.
 */
const spyRmSync = vi
	.spyOn( fs, 'rmSync' )
	.mockImplementation( () => {} );

const defaultArguments = {
	input: 'src/index.ts',
	tsconfig: 'tsconfig.json',
	external: [],
	browser: false,
	translations: false,
	sourceMap: false,
	bundle: false,
	minify: false,
	clean: false,
	banner: false
};

function getConfig( config: Partial<config.Options> = {} ) {
	return Object.assign( {}, defaultArguments, config );
}

function mockProcess( ...args: string[] ) {
	vi.stubGlobal( 'process', {
		...process,
		argv: [ 'node', 'cli-command-name', ...args ]
	} );
}

test( 'defaults', async () => {
	const spy = vi.spyOn( config, 'getRollupOutputs' );

	mockProcess();
	await buildProject();

	expect( spy ).toHaveBeenCalledWith( defaultArguments );
} )

test( '--input', async () => {
	const spy = vi.spyOn( config, 'getRollupOutputs' );

	mockProcess( '--input=index.js' );
	await buildProject();

	expect( spy ).toHaveBeenCalledWith( getConfig( { input: 'index.js' } ) );
} );

test( '--tsconfig', async () => {
	const spy = vi.spyOn( config, 'getRollupOutputs' );

	mockProcess( '--tsconfig=tsconf.json' );
	await buildProject();

	expect( spy ).toHaveBeenCalledWith( getConfig( { tsconfig: 'tsconf.json' } ) );
} );

test( '--external', async () => {
	const spy = vi.spyOn( config, 'getRollupOutputs' );

	mockProcess( '--external=foo', '--external=bar' );
	await buildProject();

	expect( spy ).toHaveBeenCalledWith( getConfig( { external: [ 'foo', 'bar' ] } ) );
} );

test( '--browser', async () => {
	const spy = vi.spyOn( config, 'getRollupOutputs' );

	mockProcess( '--browser' );
	await buildProject();

	expect( spy ).toHaveBeenCalledWith( getConfig( { browser: true } ) );
} );

test( '--translations', async () => {
	const spy = vi.spyOn( config, 'getRollupOutputs' );

	mockProcess( '--translations' );
	await buildProject();

	expect( spy ).toHaveBeenCalledWith( getConfig( { translations: true } ) );
} );

test( '--sourceMap', async () => {
	const spy = vi.spyOn( config, 'getRollupOutputs' );

	mockProcess( '--source-map' );
	await buildProject();

	expect( spy ).toHaveBeenCalledWith( getConfig( { sourceMap: true } ) );
} );

test( '--bundle', async () => {
	const spy = vi.spyOn( config, 'getRollupOutputs' );

	mockProcess( '--bundle' );
	await buildProject();

	expect( spy ).toHaveBeenCalledWith( getConfig( { bundle: true } ) );
} );

test( '--minify', async () => {
	const spy = vi.spyOn( config, 'getRollupOutputs' );

	mockProcess( '--minify' );
	await buildProject();

	expect( spy ).toHaveBeenCalledWith( getConfig( { minify: true } ) );
} );

test( '--clean', async () => {
	mockProcess( '--clean' );
	await buildProject();

	expect( spyRmSync ).toHaveBeenCalled();
} );

test( '--banner', async () => {
	spyRollupWrite.mockClear();

	mockProcess( '--banner' );
	await buildProject();

	expect( spyRollupWrite ).toHaveBeenCalledWith(
		expect.objectContaining( { banner } )
	);
} );
