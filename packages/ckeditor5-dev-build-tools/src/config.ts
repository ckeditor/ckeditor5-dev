/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'upath';
import { existsSync } from 'node:fs';
import { getOptionalPlugin, getUserDependency } from './utils.js';
import type { PackageJson } from 'type-fest';
import { defineConfig, type RolldownOptions } from 'rolldown';
import type { BuildOptions } from './build.js';
import { addBanner } from './plugins/banner.js';
import { bundleCss } from './plugins/bundleCss.js';
import { declarationFiles } from './plugins/declarations.js';
import { rawImport } from './plugins/rawImport.js';
import { splitCss } from './plugins/splitCss.js';
import { translations as translationsPlugin } from './plugins/translations.js';

/**
 * Generates Rolldown configurations.
 */
export async function getRolldownConfig( options: BuildOptions ): Promise<RolldownOptions> {
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
	 * whenever any of them are present in that array. Then, using the output path mapping,
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
	const configuredRewrites = new Map( rewrite );
	const coreRewriteSet = new Set( coreRewrites );
	const commercialRewriteSet = new Set( commercialRewrites );
	const hasTsconfig = !!tsconfig && existsSync( tsconfig );

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
		tsconfig: hasTsconfig ? tsconfig : undefined,
		platform: 'browser',
		moduleTypes: {
			'.svg': 'text'
		},
		resolve: {
			extensions,
			extensionAlias: {
				'.js': [ '.ts', '.js' ],
				'.mjs': [ '.mts', '.mjs' ],
				'.cjs': [ '.cts', '.cjs' ]
			}
		},
		output: {
			minify,
			comments: {
				legal: false,
				annotation: true,
				jsdoc: !minify
			},
			paths: id => getOutputPath( id, {
				browser,
				configuredRewrites,
				coreRewriteSet,
				commercialRewriteSet
			} )
		},
		experimental: {
			nativeMagicString: true,
			lazyBarrel: true,
			attachDebugInfo: 'none'
		},

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
			 * Allows using imports and nesting in CSS and extracts output CSS to a separate file.
			 */
			bundleCss( {
				fileName: cssFileName,
				minify,
				sourceMap
			} ),

			/**
			 * Generates CSS files containing only content and only editor styles.
			 */
			splitCss( {
				baseFileName,
				minimize: minify
			} ),

			/**
			 * Builds translation from the `.po` files.
			 */
			getOptionalPlugin(
				translations,
				translationsPlugin( { source: translations } )
			),

			/**
			 * Generates `.d.ts` files.
			 */
			getOptionalPlugin(
				declarations && hasTsconfig,
				declarationFiles( {
					sourceDirectory: path.dirname( input )
				} )
			),

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
 * Maps external module IDs to paths emitted in generated bundles.
 */
function getOutputPath(
	id: string,
	{
		browser,
		configuredRewrites,
		coreRewriteSet,
		commercialRewriteSet
	}: {
		browser: boolean;
		configuredRewrites: Map<string, string>;
		coreRewriteSet: Set<string>;
		commercialRewriteSet: Set<string>;
	}
): string {
	const configuredRewrite = configuredRewrites.get( id );

	if ( configuredRewrite !== undefined ) {
		return configuredRewrite;
	}

	const coreSourceImport = id.match( /ckeditor5\/src\/([a-z-]+)(?:[a-z-/.]+)?/ );

	if ( coreSourceImport ) {
		return browser ? 'ckeditor5' : `@ckeditor/ckeditor5-${ coreSourceImport[ 1 ] }/dist/index.js`;
	}

	const commercialSourceImport = id.match( /ckeditor5-collaboration\/src\/([a-z-]+)(?:[a-z-/.]+)?/ );

	if ( commercialSourceImport ) {
		return browser ? 'ckeditor5-premium-features' : 'ckeditor5-collaboration/dist/index.js';
	}

	if ( coreRewriteSet.has( id ) ) {
		return browser ? 'ckeditor5' : `${ id }/dist/index.js`;
	}

	if ( commercialRewriteSet.has( id ) ) {
		return browser ? 'ckeditor5-premium-features' : `${ id }/dist/index.js`;
	}

	return id;
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
