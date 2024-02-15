/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { existsSync, readFileSync } from 'fs';
import { createRequire } from 'module';
import type { PackageJson } from 'type-fest';
import { type Plugin, type RollupOptions } from 'rollup';
import { getPath } from './utils.js';
import type { BuildOptions } from './build.js';

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
import { replace } from './plugins/replace.js';
import { translations as translationsPlugin } from './plugins/translations.js';

/**
 * PostCSS plugins
 */
import postcssImport from 'postcss-import';
import postcssMixins from 'postcss-mixins';
import postcssNesting from 'postcss-nesting';

/**
 * If build speed becomes an issue, we can replace typescript with swc. However, this
 * would put the responsibility of checking the types and generating `.d.ts` files on
 * the package author.
 *
 * In the below configuration, swc is also used for minification and mangling, but it
 * doesn't do as well as terser. Both options should be checked before deciding to use
 * one or the other.
 *
 * swc( {
 * 	include: [
 * 		'**\/*.[ jt ]s',
 * 		'**\/*.json'
 * 	],
 * 	swc: {
 * 		minify,
 * 		jsc: {
 * 			minify: {
 * 				compress: true,
 * 				mangle: true,
 * 				format: {
 * 					comments: 'some'
 * 				}
 * 			},
 * 			target: 'es2019'
 * 		},
 * 		module: {
 * 			type: 'es6'
 * 		}
 * 	}
 * } )
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
const defaultExternals: Array<string> = Object.keys(
	Object.assign(
		{ '@ckeditor': true },
		pkg.dependencies,
		pkg.peerDependencies
	)
);

/**
 * Generates Rollup configurations.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function getRollupOutputs( options: Omit<BuildOptions, 'clean' | 'banner'> ) {
	const {
		input,
		tsconfig,
		external,
		declarations,
		translations,
		sourceMap,
		bundle,
		minify
	} = {
		...options,
		external: options.external || defaultExternals
	};

	return {
		input,

		/**
		 * Determines whether to bundle all dependencies or leave imports to `dependencies` and `peerDependencies` as-is.
		 */
		external: ( id: string ) => !bundle && external.some( name => id.startsWith( name ) ),

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
				extensions: [ '.mjs', '.js', '.json', '.node', '.ts', '.mts' ],
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
			getTypeScriptPlugin( { tsconfig, sourceMap, declarations } ),

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
				sourceMap
			} )
		]
	} as const satisfies RollupOptions;
}

/**
 * Returns the TypeScript plugin if tsconfig file exists, otherwise doesn't return anything.
 */
function getTypeScriptPlugin( {
	tsconfig,
	sourceMap,
	declarations
}: Pick<BuildOptions, 'tsconfig' | 'sourceMap' | 'declarations'> ): Plugin | undefined {
	if ( !existsSync( tsconfig ) ) {
		return;
	}

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
		declaration: declarations,
		declarationDir: declarations ? getPath( 'dist', 'types' ) : undefined,
		declarationMap: false, // TODO: Do we need this?
		compilerOptions: {
			rootDir: declarations ? getPath( 'src' ) : undefined
		}
	} );
}
