/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'upath';
import { existsSync } from 'node:fs';
import { getOptionalPlugin, getUserDependency } from './utils.js';
import type { PackageJson } from 'type-fest';
import { defineConfig, type Plugin, type RollupOptions } from 'rollup';
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
import { rawImport } from './plugins/rawImport.js';
import { replaceImports } from './plugins/replace.js';
import { splitCss } from './plugins/splitCss.js';
import { loadTypeScriptSources } from './plugins/loadSources.js';
import { translations as translationsPlugin } from './plugins/translations.js';

/**
 * PostCSS plugins
 */
import postcssMixins from 'postcss-mixins';
import postcssNesting from 'postcss-nesting';

/**
 * Generates Rollup configurations.
 */
export async function getRollupConfig( options: BuildOptions ): Promise<RollupOptions> {
	const {
		input,
		output,
		tsconfig,
		banner,
		external,
		rewrite,
		declarations,
		translations,
		sourceMap,
		minify,
		logLevel,
		browser
	} = options;

	/**
	 * Until we deprecate the old installation methods, integrators can use either old import paths
	 * (e.g. "@ckeditor/ckeditor5-core", "ckeditor5/src/core", etc.) or the new one (e.g. "ckeditor5")
	 * in their source code. To make this work with the new installation methods, the `external` array
	 * must be extended to include all packages that make up "ckeditor5" and "ckeditor5-premium-features"
	 * whenever any of them are present in that array. Then, in the final step of generating the bundle,
	 * we replace the old import paths with the new one.
	 *
	 * Example: When "ckeditor5" is added to the "external" array, it will be extended to also include
	 * "@ckeditor/ckeditor5-core", "@ckeditor/ckeditor5-table" and any other package included in the "ckeditor5" bundle.
	 *
	 * This mapping can be removed when old installation methods are deprecated.
	 */
	const coreRewrites = external.includes( 'ckeditor5' ) ?
		getPackageDependencies( 'ckeditor5' ) :
		[];

	const commercialRewrites = external.includes( 'ckeditor5-premium-features' ) ?
		getPackageDependencies( 'ckeditor5-premium-features' ) :
		[];

	external.push( ...coreRewrites, ...commercialRewrites );

	/**
	 * Get the name of the output CSS file based on the name of the "output" file.
	 */
	const baseFileName = path.parse( output ).name;
	const cssFileName = `${ baseFileName }.css`;

	/**
	 * Valid extensions for JavaScript and TypeScript files.
	 */
	const extensions = [ '.ts', '.mts', '.mjs', '.js', '.json', '.node' ];

	return defineConfig( {
		input,
		logLevel,

		/**
		 * List of packages that will not be bundled, but their imports will be left as they are.
		 */
		external: ( id: string ) => {
			// Bundle relative and absolute imports.
			if ( id.startsWith( '.' ) || path.isAbsolute( id ) ) {
				return false;
			}

			// Don't bundle imports that exactly match the `external` list.
			if ( external.includes( id ) ) {
				return true;
			}

			const packageName = id
				.split( '/' )
				.slice( 0, id.startsWith( '@' ) ? 2 : 1 )
				.join( '/' );

			const extension = path.extname( id );

			// Don't bundle, unless the import has non-JS or non-TS file extension (for example `.css`).
			return external.includes( packageName ) && ( !extension || extensions.includes( extension ) );
		},

		plugins: [
			/**
			 * Allows importing raw file content using the `?raw` query parameter in the import path.
			 */
			rawImport(),

			/**
			 * Ensures that `.ts` files are loaded over `.js` files if both exist.
			 */
			loadTypeScriptSources(),

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
				extensions,
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
			 * Allows using imports, mixins and nesting in CSS and extracts output CSS to a separate file.
			 */
			styles( {
				mode: [ 'extract', cssFileName ],
				plugins: [
					postcssMixins,
					postcssNesting( {
						noIsPseudoSelector: true,
						edition: '2021'
					} )
				],
				minimize: minify,
				sourceMap
			} ),

			/**
			 * Ensures empty files are emitted if files of given names were not generated.
			 */
			emitCss( {
				fileNames: [ cssFileName ]
			} ),

			/**
			 * Generates CSS files containing only content and only editor styles.
			 */
			splitCss( {
				baseFileName,
				minimize: minify
			} ),

			/**
			 * Transpiles TypeScript to JavaScript.
			 */
			swc( {
				include: [ '**/*.[jt]s' ],
				swc: {
					jsc: {
						target: 'es2022',
						loose: false
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
			getTypeScriptPlugin( { tsconfig, output, sourceMap, declarations } ),

			/**
			 * Replaces parts of the source code with the provided values.
			 */
			replaceImports( {
				replace: [
					/**
					 * Rewrites provided in the config.
					 */
					...rewrite,

					/**
					 * Matches:
					 * - ckeditor5/src/XXX (optionally with `.js` or `.ts` extension).
					 * - ckeditor5-collaboration/src/XXX (optionally with `.js` or `.ts` extension).
					 */
					[
						/ckeditor5\/src\/([a-z-]+)(?:[a-z-/.]+)?/,
						browser ? 'ckeditor5' : '@ckeditor/ckeditor5-$1/dist/index.js'
					],
					[
						/ckeditor5-collaboration\/src\/([a-z-]+)(?:[a-z-/.]+)?/,
						browser ? 'ckeditor5-premium-features' : 'ckeditor5-collaboration/dist/index.js'
					],

					/**
					 * Rewrite "old" imports to imports used in new installation methods.
					 *
					 * Examples:
					 * [ '@ckeditor/ckeditor5-core', 'ckeditor5' ],
					 * [ '@ckeditor/ckeditor5-table', 'ckeditor5' ],
					 * [ '@ckeditor/ckeditor5-ai', 'ckeditor5-premium-features' ],
					 * [ '@ckeditor/ckeditor5-case-change', 'ckeditor5-premium-features' ],
					 */
					...coreRewrites.map( pkg => [
						pkg,
						browser ? 'ckeditor5' : `${ pkg }/dist/index.js`
					] as [ string, string ] ),

					...commercialRewrites.map( pkg => [
						pkg,
						browser ? 'ckeditor5-premium-features' : `${ pkg }/dist/index.js`
					] as [ string, string ] )
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
	} );
}

/**
 * Returns a list of keys in `package.json` file of a given dependency.
 */
function getPackageDependencies( packageName: string ): Array<string> {
	try {
		const pkg: PackageJson = getUserDependency( `${ packageName }/package.json` );

		return Object.keys( pkg.dependencies! );
	} catch {
		return [];
	}
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

	return typescriptPlugin( {
		noForceEmit: true,
		tsconfig,
		sourceMap,
		inlineSources: sourceMap, // https://github.com/rollup/plugins/issues/260
		typescript: getUserDependency( 'typescript' ),
		declaration: declarations,
		declarationDir: declarations ? path.parse( output ).dir : undefined,
		compilerOptions: {
			noEmitOnError: true,
			...( declarations ? { emitDeclarationOnly: true } : { noEmit: true } )
		}
	} );
}
