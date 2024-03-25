/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'upath';
import { existsSync } from 'fs';
import { createRequire } from 'module';
import { type Plugin, type RollupOptions } from 'rollup';
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
import { banner as bannerPlugin } from './plugins/banner.js';
import { emitCss as emitCssPlugin } from './plugins/emitCss.js';
import { replace as replacePlugin } from './plugins/replace.js';
import { splitCss as splitCssPlugin } from './plugins/splitCss.js';
import { translations as translationsPlugin } from './plugins/translations.js';

/**
 * PostCSS plugins
 */
import postcssMixins from 'postcss-mixins';
import postcssNesting from 'postcss-nesting';

const REWRITES: Record<string, Array<string>> = {
	'ckeditor5': [
		'@ckeditor/ckeditor5-adapter-ckfinder',
		'@ckeditor/ckeditor5-alignment',
		'@ckeditor/ckeditor5-autoformat',
		'@ckeditor/ckeditor5-autosave',
		'@ckeditor/ckeditor5-basic-styles',
		'@ckeditor/ckeditor5-block-quote',
		'@ckeditor/ckeditor5-build-balloon-block',
		'@ckeditor/ckeditor5-build-balloon',
		'@ckeditor/ckeditor5-build-classic',
		'@ckeditor/ckeditor5-build-decoupled-document',
		'@ckeditor/ckeditor5-build-inline',
		'@ckeditor/ckeditor5-build-multi-root',
		'@ckeditor/ckeditor5-ckbox',
		'@ckeditor/ckeditor5-ckfinder',
		'@ckeditor/ckeditor5-clipboard',
		'@ckeditor/ckeditor5-cloud-services',
		'@ckeditor/ckeditor5-code-block',
		'@ckeditor/ckeditor5-core',
		'@ckeditor/ckeditor5-easy-image',
		'@ckeditor/ckeditor5-editor-balloon',
		'@ckeditor/ckeditor5-editor-classic',
		'@ckeditor/ckeditor5-editor-decoupled',
		'@ckeditor/ckeditor5-editor-inline',
		'@ckeditor/ckeditor5-editor-multi-root',
		'@ckeditor/ckeditor5-engine',
		'@ckeditor/ckeditor5-enter',
		'@ckeditor/ckeditor5-essentials',
		'@ckeditor/ckeditor5-find-and-replace',
		'@ckeditor/ckeditor5-font',
		'@ckeditor/ckeditor5-heading',
		'@ckeditor/ckeditor5-highlight',
		'@ckeditor/ckeditor5-horizontal-line',
		'@ckeditor/ckeditor5-html-embed',
		'@ckeditor/ckeditor5-html-support',
		'@ckeditor/ckeditor5-image',
		'@ckeditor/ckeditor5-indent',
		'@ckeditor/ckeditor5-language',
		'@ckeditor/ckeditor5-link',
		'@ckeditor/ckeditor5-list',
		'@ckeditor/ckeditor5-markdown-gfm',
		'@ckeditor/ckeditor5-media-embed',
		'@ckeditor/ckeditor5-mention',
		'@ckeditor/ckeditor5-minimap',
		'@ckeditor/ckeditor5-page-break',
		'@ckeditor/ckeditor5-paragraph',
		'@ckeditor/ckeditor5-paste-from-office',
		'@ckeditor/ckeditor5-remove-format',
		'@ckeditor/ckeditor5-restricted-editing',
		'@ckeditor/ckeditor5-select-all',
		'@ckeditor/ckeditor5-source-editing',
		'@ckeditor/ckeditor5-special-characters',
		'@ckeditor/ckeditor5-style',
		'@ckeditor/ckeditor5-table',
		'@ckeditor/ckeditor5-theme-lark',
		'@ckeditor/ckeditor5-typing',
		'@ckeditor/ckeditor5-ui',
		'@ckeditor/ckeditor5-undo',
		'@ckeditor/ckeditor5-upload',
		'@ckeditor/ckeditor5-utils',
		'@ckeditor/ckeditor5-watchdog',
		'@ckeditor/ckeditor5-widget',
		'@ckeditor/ckeditor5-word-count',
		'@ckeditor/ckeditor5-show-blocks',
	],
	'ckeditor5-premium-features': [
		'@ckeditor/ckeditor5-ai',
		'@ckeditor/ckeditor5-case-change',
		'@ckeditor/ckeditor5-collaboration-core',
		'@ckeditor/ckeditor5-comments',
		'@ckeditor/ckeditor5-document-outline',
		'@ckeditor/ckeditor5-export-pdf',
		'@ckeditor/ckeditor5-export-word',
		'@ckeditor/ckeditor5-format-painter',
		'@ckeditor/ckeditor5-import-word',
		'@ckeditor/ckeditor5-operations-compressor',
		'@ckeditor/ckeditor5-pagination',
		'@ckeditor/ckeditor5-paste-from-office-enhanced',
		'@ckeditor/ckeditor5-real-time-collaboration',
		'@ckeditor/ckeditor5-revision-history',
		'@ckeditor/ckeditor5-slash-command',
		'@ckeditor/ckeditor5-template',
		'@ckeditor/ckeditor5-track-changes'
	]
};

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
	 * Until we deprecate old installation methods, integrators can use "old" (e.g. "@ckeditor/ckeditor5-core" or "ckeditor5/src/core")
	 * and "new" (e.g. "ckeditor5") imports. Therefore, we need to extend the list of external libraries to include all packages
	 * that make up "ckeditor5" and "ckeditor5-premium-features" whenever any of them are added to the `external` array.
	 * 
	 * Example: When "ckeditor5" is added to the "external" array, we will update it to also include "@ckeditor/ckeditor5-core",
	 * "@ckeditor/ckeditor5-table" and every other package that's included in the "ckeditor5" bundle.
	 * 
	 * This mapping can be removed when old installation methods are deprecated.
	 */
	const mappedExternals = external.reduce( ( carry, pkg ) => carry.concat( REWRITES[ pkg ] || [] ), external );

	/**
	 * Get the name of the output CSS file based on the name of the "output" file.
	 */
	const cssFileName = `${ path.parse( output ).name }.css`;

	return {
		input,

		/**
		 * List of packages that will not be bundled, but their imports will be left as they are.
		 */
		external: ( id: string ) => mappedExternals.some( name => id.startsWith( name ) ),

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
			splitCssPlugin( {
				baseFileName: cssFileName,
				minimize: minify
			} ),

			/**
			 * Ensures empty files are emitted if files of given names were not generated.
			 */
			emitCssPlugin( {
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
			replacePlugin( {
				replace: [
					/**
					 * Matches:
					 * - ckeditor5/src/XXX (optionally with `.js` or `.ts` extension).
					 * - ckeditor5-collaboration/src/XXX (optionally with `.js` or `.ts` extension).
					 */
					[ new RegExp( 'ckeditor5/src/([a-z-]+)(?:[a-z\-/.]+)?', 'g' ), 'ckeditor5' ],
					[ new RegExp( 'ckeditor5-collaboration/src/([a-z-]+)(?:[a-z\-/.]+)?', 'g' ), 'ckeditor5-premium-features' ],

					/**
					 * Rewrite "old" imports to imports used in new installation methods.
					 * 
					 * Examples:
					 * [ '@ckeditor/ckeditor5-core', 'ckeditor5' ],
					 * [ '@ckeditor/ckeditor5-utils', 'ckeditor5' ],
					 * [ '@ckeditor/ckeditor5-ai', 'ckeditor5-premium-features' ],
					 * [ '@ckeditor/ckeditor5-case-change', 'ckeditor5-premium-features' ],
					 */
					...Object
						.entries( REWRITES )
						.filter( ( [ rewrite ] ) => external.includes( rewrite ) )
						.reduce( ( carry, [ rewrite, packages ] ) => carry.concat( packages.map( pkg => [ pkg, rewrite ] ) ), [] as Array<[ string, string ]> )
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
				bannerPlugin( { banner } )
			)
		]
	} as const satisfies RollupOptions;
}

/**
 * Returns plugin if condition is truthy. This is used only to get the types right.
 */
function getOptionalPlugin<T extends Plugin | undefined>( condition: unknown, plugin: T ): T | undefined {
	return condition ? plugin : undefined;
}

/**
 * Returns the TypeScript plugin if tsconfig file exists, otherwise doesn't return anything.
 */
function getTypeScriptPlugin({
	tsconfig,
	output,
	sourceMap,
	declarations
}: Pick<BuildOptions, 'tsconfig' | 'output' | 'sourceMap' | 'declarations'>): Plugin | undefined {
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
