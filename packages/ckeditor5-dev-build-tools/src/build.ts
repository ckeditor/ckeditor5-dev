/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import url from 'node:url';
import { styleText, parseArgs } from 'node:util';
import path from 'upath';
import { rollup, type RollupOutput, type GlobalsOption, type LogLevelOption } from 'rollup';
import { loadSourcemaps } from './plugins/loadSourcemaps.js';
import { getRollupConfig } from './config.js';
import { camelizeObjectKeys, removeWhitespace, getOptionalPlugin } from './utils.js';

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
	logLevel: LogLevelOption;
	browser: boolean;
	cwd: string;
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
	logLevel: 'warn',
	browser: false,
	get cwd() {
		return path.normalize( process.cwd() );
	}
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
	const { values } = parseArgs( {
		options: {
			'cwd': { type: 'string' },
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
			'log-level': { type: 'string' },
			'browser': { type: 'boolean' },
			'name': { type: 'string' },
			'globals': { type: 'string', multiple: true }
		},

		// Skip `node ckeditor5-build-package`.
		args: process.argv.slice( 2 ),

		// Fail when unknown argument is used.
		strict: true
	} );

	return camelizeObjectKeys( values ) as Partial<BuildOptions>;
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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
			getOptionalPlugin(
				args.sourceMap,
				loadSourcemaps()
			)
		]
	} );

	const umdBundle = await build.write( {
		format: 'umd',
		file: path.join( dir, `${ name }.umd.js` ),
		inlineDynamicImports: true,
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

	paths.forEach( pathName => {
		if ( !normalized[ pathName ] ) {
			return;
		}

		normalized[ pathName ] = path.resolve( normalized.cwd, normalized[ pathName ] );
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
			inlineDynamicImports: true,
			assetFileNames: '[name][extname]',
			sourcemap: args.sourceMap,
			name: args.name
		} );

		if ( !args.browser || !args.name ) {
			return bundle;
		}

		/**
		 * Generate UMD bundle if the `browser` parameter is set to `true` and `name` is set.
		 */
		return generateUmdBuild( args, bundle );
	} catch ( error: any ) {
		let message: string;

		if ( error.name === 'RollupError' ) {
			message = `
				${ styleText( 'red', 'ERROR: Error occurred when processing the file ' + error.id ) }.
				${ error.message }
				${ error.frame ?? '' }
			`;
		} else {
			message = `
				${ styleText( 'red', 'ERROR: The build process failed with the following error:' ) }
				${ error.message }
			`;
		}

		throw new Error( removeWhitespace( message ) );
	}
}
