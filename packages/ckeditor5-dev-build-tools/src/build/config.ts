import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { defineConfig, type RollupOptions } from 'rollup';
import { PackageJson } from 'type-fest';

import json from '@rollup/plugin-json';
import styles from 'rollup-plugin-styles';
// import modify from 'rollup-plugin-modify';
import terser from '@rollup/plugin-terser';
import svg from 'rollup-plugin-svg-import';
import commonjs from '@rollup/plugin-commonjs';
import typescriptPlugin from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

import postcssImport from 'postcss-import';
import postcssMixins from 'postcss-mixins';
import postcssNesting from 'postcss-nesting';

import { getPath } from '../utils.js';
import { translations as translationsPlugin } from '../plugins/translations.js';

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
const externals: string[] = Object.keys(
	Object.assign( {}, pkg.dependencies, pkg.peerDependencies )
);

export interface Options {
	input: string;
	tsconfig: string;
	browser: boolean;
	translations: boolean;
	sourceMap: boolean;
	bundle: boolean;
	minify: boolean;
}
/**
 * Generates Rollup configurations.
 */
export async function getRollupOutputs( options: Options ): Promise<RollupOptions> {
	const data: Options = {
		...options,
		input: getPath( options.input ),
		tsconfig: getPath( options.tsconfig ),
	};

	return getConfiguration( data );
}

/**
 * Generates Rollup configuration for NPM or browser build.
 */
async function getConfiguration( {
	input,
	tsconfig,
	browser,
	translations,
	sourceMap,
	bundle,
	minify
}: Options ): Promise<RollupOptions> {
	const require = createRequire( import.meta.url );
	const typescriptPath = require.resolve(
		'typescript',
		{ paths: [ process.cwd() ] }
	);

	return defineConfig( {
		input,

		/**
		 * Browser build should bundle all dependencies, but the NPM build should leave
		 * imports to `dependencies` and `peerDependencies` as-is.
		 */
		external: ( id: string ) => !bundle && externals.some( name => id.startsWith( name ) ),

		plugins: [
			// @ts-ignore
			commonjs( {
				sourceMap,
				defaultIsModuleExports: true
			} ),

			nodeResolve( {
				browser: true,
				preferBuiltins: false
			} ),

			// @ts-ignore
			json(),

			svg( {
				stringify: true
			} ),

			translations && translationsPlugin(),

			// @ts-ignore
			styles( {
				mode: [
					'extract',
					browser ? 'styles.min.css' : 'styles.css'
				],
				plugins: [
					postcssImport,
					postcssMixins,
					postcssNesting
				],
				minimize: browser,
				sourceMap
			} ),

			// @ts-ignore
			typescriptPlugin( {
				tsconfig,
				sourceMap,
				typescript: require( typescriptPath ),
				declaration: !browser,
				declarationDir: !browser ? getPath( 'dist', 'types' ) : undefined,
				declarationMap: false, // TODO: Do we need this?
				compilerOptions: {
					rootDir: !browser ? getPath( 'src' ) : undefined,
				}
			} ),

			// @ts-ignore
			minify && terser( {
				sourceMap,
				format: {
					// TODO
					comments: ( node: any, comment: any ) => /@license/.test( comment.value ) && ( /^!/.test( comment.value ) || !/CKSource/.test( comment.value ) )
				}
			} )
		]
	} );
}
