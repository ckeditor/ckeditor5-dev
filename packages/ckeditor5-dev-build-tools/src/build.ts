/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import util from 'util';
import { rollup, type RollupOutput } from 'rollup';
import { getPath, camelizeObjectKeys } from './utils.js';
import { getRollupOutputs } from './config.js';

export interface BuildOptions {
	input: string;
	tsconfig: string;
	banner: string;
	external: Array<string> | false;
	declarations: boolean;
	translations: boolean;
	sourceMap: boolean;
	bundle: boolean;
	minify: boolean;
	clean: boolean;
}

export const defaultOptions: BuildOptions = {
	input: 'src/index.ts',
	tsconfig: 'tsconfig.json',
	banner: '',
	external: false,
	declarations: false,
	translations: false,
	sourceMap: false,
	bundle: false,
	minify: false,
	clean: false
};

/**
 * Reads CLI arguments and turn the keys into camelcase.
 */
function getCliArguments(): Partial<BuildOptions> {
	const { values } = util.parseArgs( {
		options: {
			'input': { type: 'string' },
			'tsconfig': { type: 'string' },
			'banner': { type: 'string' },
			'external': { type: 'string', multiple: true },
			'declarations': { type: 'boolean' },
			'translations': { type: 'boolean' },
			'source-map': { type: 'boolean' },
			'bundle': { type: 'boolean' },
			'minify': { type: 'boolean' },
			'clean': { type: 'boolean' }
		},

		// Skip `node ckeditor5-build-package`.
		args: process.argv.slice( 2 ),

		// Fail when unknown argument is used.
		strict: true
	} );

	return camelizeObjectKeys( values );
}

/**
 * Merges user provided options with the defaults
 * and transforms relative paths to absolute paths.
 */
async function normalizeOptions( options: Partial<BuildOptions> ): Promise<BuildOptions> {
	const normalized = Object.assign( {}, defaultOptions, options );

	normalized.input = getPath( normalized.input );
	normalized.tsconfig = getPath( normalized.tsconfig );

	if ( normalized.banner ) {
		const path = getPath( normalized.banner );
		const { banner } = await import( path );

		normalized.banner = banner;
	}

	return normalized;
}

/**
 * Builds project based on options provided as an object or CLI arguments.
 */
export async function build(
	options: Partial<BuildOptions> = getCliArguments()
): Promise<RollupOutput> {
	const {
		clean,
		...args
	}: BuildOptions = await normalizeOptions( options );

	/**
	 * Create Rollup configuration based on provided arguments.
	 */
	const output = await getRollupOutputs( args );

	/**
	 * Remove old build directory.
	 */
	if ( clean ) {
		fs.rmSync( getPath( 'dist' ), { recursive: true, force: true } );
	}

	/**
	 * Run Rollup to generate bundles.
	 */
	const build = await rollup( output );

	/**
	 * Write bundles to the filesystem.
	 */
	return build.write( {
		format: 'esm',
		file: getPath( 'dist', args.minify ? 'index.min.js' : 'index.js' ),
		assetFileNames: '[name][extname]',
		sourcemap: args.sourceMap
	} );
}
