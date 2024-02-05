import { rmSync } from 'fs';
import { parseArgs, type ParseArgsConfig } from 'util';
import { rollup } from 'rollup';
import type { CamelCase, CamelCasedProperties } from 'type-fest';
import { getPath } from '../utils.js';
import { getRollupOutputs, type Options } from './config.js';

/**
 * Transforms `kebab-case` strings to `camelCase`.
 */
function camelize<const T extends string>( s: T ): CamelCase<T> {
	return s.replace( /-./g, x => x[1]!.toUpperCase() ) as CamelCase<T>;
}

/**
 * Transforms all object keys from `kebab-case` to `camelCase`.
 */
function camelizeObjectKeys<const T extends Record<string, any>>( obj: T ): CamelCasedProperties<T> {
	return Object.fromEntries(
		Object
			.entries( obj )
			.map( ( [ key, value ] ) => [ camelize( key ), value ] )
	) as CamelCasedProperties<T>;
}

/**
 * Banner added to the top of output JavaScript files.
 */
const banner: string = `
/*!
 * @license Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */`;


export async function buildProject(): Promise<void> {
	const options = {
		'input': {
			type: 'string',
			default: 'src/index.ts'
		},
		'tsconfig': {
			type: 'string',
			default: 'tsconfig.json'
		},
		'browser': {
			type: 'boolean',
			default: false
		},
		'translations': {
			type: 'boolean',
			default: false
		},
		'source-map': {
			type: 'boolean',
			default: false
		},
		'bundle': {
			type: 'boolean',
			default: false
		},
		'external': {
			type: 'string',
			multiple: true,
			default: []
		},
		'minify': {
			type: 'boolean',
			default: false
		},
		'clean': {
			type: 'boolean',
			default: false
		}
	} satisfies ParseArgsConfig['options'];

	/**
	 * Parse raw CLI arguments.
	 */
	const { values } = parseArgs( {
		options,
		args: process.argv.slice(2),
		strict: true
	} );

	/**
	 * Transform `kebab-case` object keys to `camelCase`.
	 */
	const args = camelizeObjectKeys( values );

	/**
	 * Create Rollup configuration based on provided arguments.
	 */
	const output = await getRollupOutputs( args as Options );

	/**
	 * Remove old build directory.
	 */
	args.clean && rmSync( getPath( 'dist' ), { recursive: true, force: true } );

	/**
	 * Run Rollup to generate bundles.
	 */
	const build = await rollup( output );

	/**
	 * Write bundles to the filesystem.
	 */
	await build.write( {
		format: 'esm',
		file: getPath( 'dist', args.browser ? 'index.min.js' : 'index.js' ),
		assetFileNames: '[name][extname]',
		sourcemap: args.sourceMap,
		banner
	} );
}
