/* v8 ignore start */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { readFileSync } from 'fs';
import { defineConfig, type RollupOptions } from 'rollup';
import type { PackageJson } from 'type-fest';

import styles from 'rollup-plugin-styles';
import svg from 'rollup-plugin-svg-import';
import esbuild from 'rollup-plugin-esbuild';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

import postcssImport from 'postcss-import';
import postcssMixins from 'postcss-mixins';
import postcssNesting from 'postcss-nesting';

import { getPath } from '../utils.js';
import { translations } from '../plugins/translations.js';

/**
 * In the future, we could try using `rollup-plugin-esbuild` to greatly improve
 * the build speed, but this would require running `tsc --emitDeclarationOnly`
 * separately to generate TypeScript declaration files.
 *
 * Besides improved build speed, it'd allow us to remove the following plugins:
 * - `@rollup/plugin-json`,
 * - `@rollup/plugin-typescript`,
 * - `rollup-plugin-modify`,
 * - `@rollup/plugin-commonjs`,
 * - `@rollup/plugin-terser` (use it only for mangling),
 * - `rollup-plugin-svg-import` (probably, with `loader: text`).
 */

/**
 * Contents of the `package.json` in the current working directory.
 */
const pkg: PackageJson = JSON.parse(
	readFileSync( getPath( 'package.json' ), { encoding: 'utf-8' } )
);

/**
 * List of all `dependencies` and `peerDependencies` in the package.
 */
const externals: Array<string> = Object.keys(
	Object.assign( {}, pkg.dependencies, pkg.peerDependencies )
);

/**
 * Banner added to the top of output JavaScript files.
 */
const banner: string = `
/**
 * @license Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */`;

export interface Options {
	input: string;
	browser: boolean;
	sourceMap: boolean;
	tsconfig: string;
	mangle: boolean;
}

type ConfigOptions = Omit<Options, 'browser'>;

/**
 * Generates Rollup configurations.
 */
export async function getRollupOutputs( options: Options ): Promise<Array<RollupOptions>> {
	const data: ConfigOptions = {
		input: options.input && getPath( options.input ),
		tsconfig: options.tsconfig && getPath( options.tsconfig ),
		sourceMap: options.sourceMap,
		mangle: options.mangle
	};

	const configs: Array<RollupOptions> = [
		await getConfiguration( data, false )
	];

	if ( options.browser ) {
		configs.push( await getConfiguration( data, true ) );
	}

	return configs;
}

/**
 * Generates Rollup configuration for NPM or browser build.
 */
async function getConfiguration(
	{ input, tsconfig, sourceMap }: ConfigOptions,
	forBrowser: boolean
): Promise<RollupOptions> {
	/**
	 * Whether to generate source maps.
	 */
	const shouldGenerateSourceMap = sourceMap && !forBrowser;

	return defineConfig( {
		input,
		output: {
			format: 'esm',
			file: getPath( 'dist', forBrowser ? 'index.min.js' : 'index.js' ),
			assetFileNames: '[name][extname]',
			sourcemap: shouldGenerateSourceMap,
			banner
		},

		/**
		 * Browser build should bundle all dependencies, but the NPM build should leave
		 * imports to `dependencies` and `peerDependencies` as-is.
		 */
		external: ( id: string ) => !forBrowser && externals.some( name => id.startsWith( name ) ),

		plugins: [
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			commonjs( {
				defaultIsModuleExports: true
			} ),

			nodeResolve( {
				browser: true,
				preferBuiltins: false
			} ),

			esbuild( {
				exclude: [ /node_modules/, ...externals ],
				format: 'esm',
				treeShaking: true,
				sourceMap: shouldGenerateSourceMap,
				minify: forBrowser,
				target: 'ES2019',
				tsconfig,
				loaders: {
					'.json': 'json',
					'.css': 'empty',
					'.svg': 'empty'
				}
			} ),

			svg( {
				stringify: true
			} ),

			translations(),

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			styles( {
				mode: [
					'extract',
					forBrowser ? 'styles.min.css' : 'styles.css'
				],
				plugins: [
					postcssImport,
					postcssMixins,
					postcssNesting
				],
				minimize: forBrowser,
				sourceMap: shouldGenerateSourceMap
			} )
		]
	} );
}
