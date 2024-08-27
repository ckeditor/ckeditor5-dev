/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import url from 'url';
import util from 'util';
import chalk from 'chalk';
import path from 'upath';
import { rollup, type RollupOutput, type GlobalsOption } from 'rollup';
import { getRollupConfig } from './config.js';
import { getCwdPath, camelizeObjectKeys, removeWhitespace } from './utils.js';

export interface BuildOptions {
	input: string;
	output: string;
	tsconfig: string;
	name: string;
	globals: GlobalsOption | Array<string>;
	banner: string;
	external: Array<string>;
	rewrite: Array<[string, string]>;
	declarations: boolean;
	translations: string;
	sourceMap: boolean;
	minify: boolean;
	clean: boolean;
	browser: boolean;
}

export const defaultOptions: BuildOptions = {
	input: 'src/index.ts',
	output: 'dist/index.js',
	tsconfig: 'tsconfig.json',
	name: '',
	globals: {},
	banner: '',
	external: [],
	rewrite: [],
	declarations: false,
	translations: '',
	sourceMap: false,
	minify: false,
	clean: false,
	browser: false
};

/**
 * `ckeditor5` and `ckeditor5-premium-features` globals.
 */
const CKEDITOR_GLOBALS: GlobalsOption = {
	ckeditor5: 'CKEDITOR',
	'ckeditor5-premium-features': 'CKEDITOR_PREMIUM_FEATURES'
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
			'translations': { type: 'string' },
			'source-map': { type: 'boolean' },
			'minify': { type: 'boolean' },
			'clean': { type: 'boolean' },
			'browser': { type: 'boolean' },
			'name': { type: 'string' },
			'globals': { type: 'string', multiple: true }
		},

		// Skip `node ckeditor5-build-package`.
		args: process.argv.slice( 2 ),

		// Fail when unknown argument is used.
		strict: true
	} );

	return camelizeObjectKeys( values );
}

/**
 * Convert `globals` parameter to object when it's passed via CLI as `<external-id:variableName,another-external-id:anotherVariableName, >`
 */
function normalizeGlobalsParameter( globals: GlobalsOption | Array<string> ): GlobalsOption | Array<string> {
	if ( Array.isArray( globals ) ) {
		return Object.fromEntries( globals.map( item => item.split( ':' ) ) );
	}

	return globals;
}

/**
 * Generates `UMD` build based on previous `ESM` build.
 */
async function generateUmdBuild( args: BuildOptions, bundle: RollupOutput ): Promise<RollupOutput> {
	args.input = args.output;

	const { dir, name } = path.parse( args.output );
	const { plugins, ...config } = await getRollupConfig( args );

	/**
	 * Ignore the plugins we used for the ESM build. Instead, add a new plugin to not only
	 * load the source code of the dependencies (which is the default in Rollup for better
	 * performance), but also their source maps to generate a proper final source map for
	 * the UMD bundle.
	 */
	const build = await rollup( {
		...config,
		plugins: [
			{
				name: 'load-source-map',
				load( id: string ) {
					if ( !args.sourceMap ) {
						return;
					}

					return {
						code: fs.readFileSync( id, 'utf-8' ),
						map: fs.readFileSync( `${ id }.map`, 'utf-8' )
					};
				}
			}
		]
	} );

	const umdBundle = await build.write( {
		format: 'umd',
		file: path.join( dir, `${ name }.umd.js` ),
		assetFileNames: '[name][extname]',
		sourcemap: args.sourceMap,
		name: args.name,
		globals: {
			...CKEDITOR_GLOBALS,
			...args.globals as GlobalsOption
		}
	} );

	return {
		output: [
			...bundle.output,
			...umdBundle.output
		]
	};
}

/**
 * Merges user-provided options with the defaults and converts relative paths
 * to absolute paths. Paths to non-existent files are also removed.
 */
async function normalizeOptions( options: Partial<BuildOptions> ): Promise<BuildOptions> {
	const normalized: BuildOptions = Object.assign( {}, defaultOptions, options );

	const paths = [
		'input',
		'output',
		'tsconfig',
		'translations',
		'banner'
	] as const;

	paths.forEach( path => {
		if ( !normalized[ path ] ) {
			return;
		}

		normalized[ path ] = getCwdPath( normalized[ path ] );
	} );

	/**
	 * Replace banner path with the actual banner contents.
	 */
	if ( normalized.banner ) {
		const { href } = url.pathToFileURL( normalized.banner );
		const { banner } = await import( href );

		normalized.banner = banner;
	}

	if ( normalized.globals ) {
		normalized.globals = normalizeGlobalsParameter( normalized.globals );
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
		 * Remove old build directory.
		 */
		if ( args.clean ) {
			const { dir } = path.parse( args.output );

			fs.rmSync( dir, { recursive: true, force: true } );
		}

		/**
		 * Create Rollup configuration based on provided arguments.
		 */
		const config = await getRollupConfig( args );

		/**
		 * Run Rollup to generate bundles.
		 */
		const build = await rollup( config );

		/**
		 * Write bundles to the filesystem.
		 */
		const bundle = await build.write( {
			format: 'esm',
			file: args.output,
			assetFileNames: '[name][extname]',
			sourcemap: args.sourceMap,
			name: args.name
		} );

		if ( !args.browser ) {
			return bundle;
		}

		/**
		 * Generate UMD bundle if the `browser` parameter is set to `true`.
		 */
		return generateUmdBuild( args, bundle );
	} catch ( error: any ) {
		let message: string;

		if ( error.name === 'RollupError' ) {
			message = `
				${ chalk.red( 'ERROR: Error occurred when processing the file ' + error.id ) }.
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
