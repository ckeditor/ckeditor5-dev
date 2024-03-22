/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import util from 'util';
import chalk from 'chalk';
import { rollup, type RollupOutput } from 'rollup';
import { getRollupConfig } from './config.js';
import { getCwdPath, camelizeObjectKeys, removeWhitespace } from './utils.js';

export interface BuildOptions {
	input: string;
	output: string;
	tsconfig: string;
	banner: string;
	external: Array<string>;
	declarations: boolean;
	translations: boolean;
	sourceMap: boolean;
	minify: boolean;
	clean: boolean;
}

export const defaultOptions: BuildOptions = {
	input: 'src/index.ts',
	output: 'dist/index.js',
	tsconfig: 'tsconfig.json',
	banner: '',
	external: [],
	declarations: false,
	translations: false,
	sourceMap: false,
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
			'output': { type: 'string' },
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

	normalized.input = getCwdPath( normalized.input );
	normalized.output = getCwdPath( normalized.output );
	normalized.tsconfig = getCwdPath( normalized.tsconfig );

	if ( normalized.banner ) {
		const path = getCwdPath( normalized.banner );
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
	try {
		const args: BuildOptions = await normalizeOptions( options );

		/**
		 * Create Rollup configuration based on provided arguments.
		 */
		const config = await getRollupConfig( args );

		/**
		 * Remove old build directory.
		 */
		if ( args.clean ) {
			fs.rmSync( getCwdPath( 'dist' ), { recursive: true, force: true } );
		}

		/**
		 * Run Rollup to generate bundles.
		 */
		const build = await rollup( config );

		/**
		 * Write bundles to the filesystem.
		 */
		return await build.write( {
			format: 'esm',
			file: args.output,
			assetFileNames: '[name][extname]',
			sourcemap: args.sourceMap
		} );
	} catch ( error: any ) {
		let message: string;

		if ( error.name === 'RollupError' ) {
			message = `
				${ chalk.red( 'ERROR: Error occured when processing the file ' + error.id ) }.
				${ error.message }
				${ error.frame ?? '' }
			`;
		} else {
			message = `
				${ chalk.red( 'ERROR: The build process failed with the following error:' ) }
				${ error.message }
			`;
		}

		throw new Error( removeWhitespace( message ) );
	}
}
