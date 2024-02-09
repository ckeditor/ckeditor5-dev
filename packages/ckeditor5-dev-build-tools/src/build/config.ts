/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createRequire } from 'module';
import { readFileSync, accessSync, constants } from 'fs';
import chalk from 'chalk';
import type { PackageJson } from 'type-fest';
import { defineConfig, type Plugin, type RollupOptions } from 'rollup';
import { getPath } from '../utils.js';

/**
 * Rollup plugins
 */
import json from '@rollup/plugin-json';
import styles from 'rollup-plugin-styles';
import terser from '@rollup/plugin-terser';
import svg from 'rollup-plugin-svg-import';
import commonjs from '@rollup/plugin-commonjs';
import typescriptPlugin from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { replace } from '../plugins/replace.js';
import { translations as translationsPlugin } from '../plugins/translations.js';

/**
 * PostCSS plugins
 */
import postcssImport from 'postcss-import';
import postcssMixins from 'postcss-mixins';
import postcssNesting from 'postcss-nesting';

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
 * - `rollup-plugin-svg-import` (probably, with `loader: text`).
 */

/**
 * Contents of the `package.json` in the current working directory.
 */
const pkg: PackageJson = JSON.parse(
	readFileSync( getPath( 'package.json' ), { encoding: 'utf-8' } )
);

/**
 * When the `--bundle` and `--external` arguments are not provided, then all
 * packages defined in `dependencies` and `peerDependencies` of the package
 * and all packages starting with `@ckeditor` will be treated as externals.
 */
const externals: Array<string> = Object.keys(
	Object.assign(
		{ '@ckeditor': true },
		pkg.dependencies,
		pkg.peerDependencies
	)
);

export interface Options {
	input: string;
	tsconfig: string;
	browser: boolean;
	translations: boolean;
	sourceMap: boolean;
	bundle: boolean;
	external: Array<string>;
	minify: boolean;
}

/**
 * Generates Rollup configurations.
 */
export async function getRollupOutputs( options: Options ): Promise<RollupOptions> {
	const data: Options = {
		...options,
		external: options.external.length ? options.external : externals,
		input: getPath( options.input ),
		tsconfig: getPath( options.tsconfig )
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
	return defineConfig( {
		input,

		/**
		 * Browser build should bundle all dependencies, but the NPM build should leave
		 * imports to `dependencies` and `peerDependencies` as-is.
		 */
		external: ( id: string ) => !bundle && externals.some( name => id.startsWith( name ) ),

		plugins: [
			/**
			 * Converts CommonJS modules to ES6.
			 */
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			commonjs( {
				sourceMap,
				defaultIsModuleExports: true
			} ),

			/**
			 * Resolves imports using the Node resolution algorithm.
			 */
			nodeResolve( {
				browser: true,
				preferBuiltins: false
			} ),

			/**
			 * Allows importing JSON files.
			 */
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			json(),

			/**
			 * Turns SVG file imports into JavaScript strings.
			 */
			svg( {
				stringify: true
			} ),

			/**
			 * Builds translation from the `.po` files.
			 */
			translations && translationsPlugin(),

			/**
			 * Allows using imports, mixins and nesting in CSS and exctacts output CSS to a separate file.
			 */
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			styles( {
				mode: [
					'extract',
					minify ? 'styles.min.css' : 'styles.css'
				],
				plugins: [
					postcssImport,
					postcssMixins,
					postcssNesting
				],
				minimize: minify,
				sourceMap
			} ),

			/**
			 * Adds support for TypeScript syntax if tsconfig file exists.
			 */
			getTypeScriptPlugin( { tsconfig, sourceMap, browser } ),

			/**
			 * Replaces parts of the source code with the provided values.
			 */
			replace( {
				replace: [
					/**
					 * Replaces the following imports with '@ckeditor/ckeditor5-core/dist/index.js':
					 *
					 * - 'ckeditor5/src/core';
					 * - 'ckeditor5/src/core.js';
					 * - '@ckeditor/ckeditor5-core';
					 * - '@ckeditor/ckeditor5-core/src/index';
					 * - '@ckeditor/ckeditor5-core/src/index.js';
					 */
					[ /(@ckeditor\/ckeditor5-|ckeditor5\/src\/)([a-z-]+)(?:[a-z\-/.]+)?/g, '@ckeditor/ckeditor5-$2/dist/index.js' ]
				],
				sourceMap
			} ),

			/**
			 * Minifies and mangles the output. It also removes all code comments except for license comments.
			 */
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			minify && terser( {
				sourceMap,
				format: {
					// TODO
					comments( node: any, comment: any ) {
						return /@license/.test( comment.value ) && ( /^!/.test( comment.value ) || !/CKSource/.test( comment.value ) );
					}
				}
			} )
		]
	} );
}

/**
 * Returns the TypeScript plugin if tsconfig file exists, otherwise doesn't return anything.
 */
function getTypeScriptPlugin( {
	tsconfig,
	sourceMap,
	browser
}: Pick<Options, 'tsconfig' | 'sourceMap' | 'browser'> ): Plugin | undefined {
	try {
		/**
		 * Check if tsconfig file exists.
		 */
		accessSync( tsconfig, constants.R_OK );

		/**
		 * Get the path to TypeScript relative to the current working directory. This is needed,
		 * because this plugin might use different TypeScript version than the project using it.
		 */
		const require = createRequire( import.meta.url );
		const typescriptPath = require.resolve(
			'typescript',
			{ paths: [ process.cwd() ] }
		);

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return typescriptPlugin( {
			tsconfig,
			sourceMap,
			typescript: require( typescriptPath ),
			declaration: !browser,
			declarationDir: !browser ? getPath( 'dist', 'types' ) : undefined,
			declarationMap: false, // TODO: Do we need this?
			compilerOptions: {
				rootDir: !browser ? getPath( 'src' ) : undefined
			}
		} );
	} catch {
		console.log( chalk.yellow( 'Could not find the TypeScript configuration file. Skipping TypeScript processing.\n' ) );
	}
}
