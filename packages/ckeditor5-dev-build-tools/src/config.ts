/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'upath';
import { existsSync } from 'fs';
import { createRequire } from 'module';
import type { InputPluginOption, Plugin, RollupOptions } from 'rollup';
import type { BuildOptions } from './build.js';

/**
 * Rollup plugins
 */
import swc from '@rollup/plugin-swc';
import json from '@rollup/plugin-json';
import styles from 'rollup-plugin-styles';
import terser from '@rollup/plugin-terser';
import svg from 'rollup-plugin-svg-import';
import commonjs from '@rollup/plugin-commonjs';
import typescriptPlugin from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { addBanner } from './plugins/banner.js';
import { emitCss } from './plugins/emitCss.js';
import { replaceImports } from './plugins/replace.js';
import { splitCss } from './plugins/splitCss.js';
import { translations as translationsPlugin } from './plugins/translations.js';

/**
 * PostCSS plugins
 */
import postcssMixins from 'postcss-mixins';
import postcssNesting from 'postcss-nesting';

const require = createRequire( import.meta.url );

/**
 * Generates Rollup configurations.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function getRollupConfig( options: BuildOptions ) {
	const {
		input,
		output,
		tsconfig,
		banner,
		external,
		declarations,
		translations,
		sourceMap,
		minify
	} = options;

	/**
	 * Until we deprecate old installation methods, integrators can either use "old" imports (e.g. "@ckeditor/ckeditor5-core", "ckeditor5/src/core", etc.)
	 * or "new" one (e.g. "ckeditor5") in their source code. To make this work with new installation methods, we need to override the old imports by:
	 *
	 * 1. extending the `external` array to include all packages that make up "ckeditor5" and "ckeditor5-premium-features" whenever any of them is present.
	 * 2. replacing the old imports with the new one in the final step of generating the bundle.
	 *
	 * Example: When "ckeditor5" is added to the "external" array, we will update it to also include "@ckeditor/ckeditor5-core",
	 * "@ckeditor/ckeditor5-table" and every other package that's included in the "ckeditor5" bundle.
	 *
	 * This mapping can be removed when old installation methods are deprecated.
	 */
	const rewrites: Record<string, Array<string>> = await import(
		resolveUserDependency( 'ckeditor5/packages-lists.json' ),
		{ with: { type: 'json' } }
	);
	const mappedExternals = external.reduce( ( carry, pkg ) => carry.concat( rewrites[ pkg ] || [] ), external );
	const ckeditor5Import = new RegExp( 'ckeditor5/src/([a-z-]+)(?:[a-z-/.]+)?' );
	const collaborationImport = new RegExp( 'ckeditor5-collaboration/src/([a-z-]+)(?:[a-z-/.]+)?' );

	/**
	 * Get the name of the output CSS file based on the name of the "output" file.
	 */
	const cssFileName = `${ path.parse( output ).name }.css`;

	return {
		input,

		/**
		 * List of packages that will not be bundled, but their imports will be left as they are.
		 */
		external: ( id: string ) => {
			return mappedExternals.includes( id ) ||
				( mappedExternals.includes( 'ckeditor5' ) && ckeditor5Import.test( id ) ) ||
				( mappedExternals.includes( 'ckeditor5-premium-features' ) && collaborationImport.test( id ) );
		},

		plugins: [
			/**
			 * Converts CommonJS modules to ES6.
			 */
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
			json(),

			/**
			 * Turns SVG file imports into JavaScript strings.
			 */
			svg( {
				stringify: true
			} ),

			/**
			 * Allows using imports, mixins and nesting in CSS and exctacts output CSS to a separate file.
			 */
			styles( {
				mode: [ 'extract', cssFileName ],
				plugins: [
					postcssMixins,
					postcssNesting( {
						noIsPseudoSelector: true
					} )
				],
				minimize: minify,
				sourceMap
			} ),

			/**
			 * Generates CSS files containing only content and only editor styles.
			 */
			splitCss( {
				baseFileName: cssFileName,
				minimize: minify
			} ),

			/**
			 * Ensures empty files are emitted if files of given names were not generated.
			 */
			emitCss( {
				fileNames: [ cssFileName ]
			} ),

			/**
			 * Transpiles TypeScript to JavaScript.
			 */
			swc( {
				include: [ '**/*.[jt]s' ],
				swc: {
					jsc: {
						target: 'es2019'
					},
					module: {
						type: 'es6'
					}
				}
			} ),

			/**
			 * Builds translation from the `.po` files.
			 */
			getOptionalPlugin(
				translations,
				translationsPlugin( { source: translations } )
			),

			/**
			 * Does type checking and generates `.d.ts` files.
			 */
			getOptionalPlugin(
				declarations,
				getTypeScriptPlugin( { tsconfig, output, sourceMap, declarations } )
			),

			/**
			 * Replaces parts of the source code with the provided values.
			 */
			replaceImports( {
				replace: [
					/**
					 * Matches:
					 * - ckeditor5/src/XXX (optionally with `.js` or `.ts` extension).
					 * - ckeditor5-collaboration/src/XXX (optionally with `.js` or `.ts` extension).
					 */
					[ ckeditor5Import, 'ckeditor5' ],
					[ collaborationImport, 'ckeditor5-premium-features' ],

					/**
					 * Rewrite "old" imports to imports used in new installation methods.
					 *
					 * Examples:
					 * [ '@ckeditor/ckeditor5-core', 'ckeditor5' ],
					 * [ '@ckeditor/ckeditor5-table', 'ckeditor5' ],
					 * [ '@ckeditor/ckeditor5-ai', 'ckeditor5-premium-features' ],
					 * [ '@ckeditor/ckeditor5-case-change', 'ckeditor5-premium-features' ],
					 */
					...Object
						.entries( rewrites )
						.filter( ( [ rewrite ] ) => external.includes( rewrite ) )
						.reduce(
							( carry, [ rewrite, packages ] ) => carry.concat( packages.map( pkg => [ pkg, rewrite ] ) ),
							[] as Array<[ string, string ]>
						)
				]
			} ),

			/**
			 * Minifies and mangles the output. It also removes all code comments except for license comments.
			 */
			getOptionalPlugin( minify, terser( {
				sourceMap,
				format: {
					comments: false
				}
			} ) ),

			/**
			 * Adds provided banner to the top of output JavaScript and CSS files.
			 */
			getOptionalPlugin(
				banner,
				addBanner( { banner } )
			)
		]
	} as const satisfies RollupOptions;
}

/**
 * Returns plugin if condition is truthy. This is used only to get the types right.
 */
function getOptionalPlugin<T extends InputPluginOption>( condition: unknown, plugin: T ): T | undefined {
	return condition ? plugin : undefined;
}

/**
 * Returns the path to the provided dependency relative to the current working directory. This is needed
 * to ensure that the dependency of this package itself (which may be in a different version) is not used.
 */
function resolveUserDependency( dependencyName: string ): string {
	return require.resolve(
		dependencyName,
		{ paths: [ process.cwd() ] }
	);
}

/**
 * Returns the TypeScript plugin if tsconfig file exists, otherwise doesn't return anything.
 */
function getTypeScriptPlugin( {
	tsconfig,
	output,
	sourceMap,
	declarations
}: Pick<BuildOptions, 'tsconfig' | 'output' | 'sourceMap' | 'declarations'> ): Plugin | undefined {
	if ( !existsSync( tsconfig ) ) {
		return;
	}

	const typescriptPath = resolveUserDependency( 'typescript' );

	return typescriptPlugin( {
		tsconfig,
		sourceMap,
		noEmitOnError: true,
		inlineSources: sourceMap, // https://github.com/rollup/plugins/issues/260
		typescript: require( typescriptPath ),
		declaration: declarations,
		declarationDir: declarations ? path.join( path.parse( output ).dir, 'types' ) : undefined,
		compilerOptions: {
			emitDeclarationOnly: true
		}
	} );
}
