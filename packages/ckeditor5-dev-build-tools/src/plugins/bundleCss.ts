/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import { basename, dirname } from 'node:path';
import { bundleAsync, Features, type Warning as LightningCssWarning } from 'lightningcss';
import type { OutputBundle, OutputChunk, Plugin, PluginContext } from 'rolldown';
import upath from 'upath';

export interface RollupBundleCssOptions {

	/**
	 * Name or path of the generated combined CSS bundle. Editor and content bundle names
	 * are derived by adding `-editor` and `-content` before the extension.
	 */
	fileName: string;

	/**
	 * Flag to choose if the output should be minimized or not.
	 *
	 * @default false
	 */
	minify?: boolean;

	/**
	 * Whether to generate source map for the output CSS bundle.
	 *
	 * @default false
	 */
	sourceMap?: boolean;
}

const CSS_ID_REGEXP = /\.css(?:[?#].*)?$/;

const VIRTUAL_ENTRY_ID = '/__cke5_bundle_css__.css';

const EDITOR_ENTRY_FILE_NAME = 'index-editor.css';

const CONTENT_ENTRY_FILE_NAME = 'index-content.css';

const QUERY_AND_HASH_REGEXP = /[#?].*$/;

/**
 * Removes query strings and hash fragments from the module id.
 */
function normalizeId( id: string ): string {
	return upath.normalizeSafe( id.replace( QUERY_AND_HASH_REGEXP, '' ) );
}

/**
 * Returns whether the module id points to a CSS file.
 */
function isCssModule( id: string ): boolean {
	return CSS_ID_REGEXP.test( id );
}

/**
 * Returns whether the import specifier references an external resource.
 */
function isExternalImport( specifier: string ): boolean {
	return URL.canParse( specifier ) || specifier.startsWith( '//' );
}

/**
 * Emits warning diagnostics returned by Lightning CSS.
 */
function emitLightningCssWarnings(
	context: PluginContext,
	warnings: Array<LightningCssWarning>,
	outputFileName: string,
	emittedWarnings: Set<string>
): void {
	for ( const warning of warnings ) {
		const warningFileName = warning.loc.filename === VIRTUAL_ENTRY_ID ?
			outputFileName :
			normalizeId( warning.loc.filename );
		const warningLocation = `${ warningFileName }:${ warning.loc.line }:${ warning.loc.column + 1 }`;
		const warningType = warning.type ? ` (${ warning.type })` : '';

		const warningKey = `${ warning.loc.filename }:${ warning.loc.line }:${ warning.loc.column }:${ warning.type }:${ warning.message }`;

		if ( emittedWarnings.has( warningKey ) ) {
			continue;
		}

		emittedWarnings.add( warningKey );
		context.warn( `Lightning CSS warning in ${ warningLocation }${ warningType }: ${ warning.message }` );
	}
}

/**
 * Returns the chunk modules to use as starting points when collecting CSS imports.
 *
 * Walking the import graph from every module of the chunk works, but is very slow for large
 * bundles. Walking from the facade (entry) module alone gives the same result: it reaches every
 * CSS file, and since it is the last module in the chunk, it also decides the final CSS order
 * after the keep-last deduplication in `getOrderedCssModules()`.
 *
 * Two special cases: the walk follows only static imports, so targets of inlined dynamic imports
 * are kept as extra starting points, and chunks without a facade module use every module.
 */
function getTraversalRoots( chunk: OutputChunk, getModuleInfo: PluginContext[ 'getModuleInfo' ] ): Array<string> {
	const moduleIds = Object.keys( chunk.modules );

	if ( !chunk.facadeModuleId || !( chunk.facadeModuleId in chunk.modules ) ) {
		return moduleIds;
	}

	const dynamicImportTargets = new Set<string>();

	for ( const moduleId of moduleIds ) {
		for ( const importedId of getModuleInfo( moduleId )?.dynamicallyImportedIds || [] ) {
			if ( importedId in chunk.modules ) {
				dynamicImportTargets.add( importedId );
			}
		}
	}

	return moduleIds.filter( moduleId => moduleId === chunk.facadeModuleId || dynamicImportTargets.has( moduleId ) );
}

/**
 * Returns CSS imports from a chunk in the same order as `rollup-plugin-styles`.
 */
function getChunkCssImports(
	chunk: OutputChunk,
	getModuleInfo: PluginContext[ 'getModuleInfo' ],
	moduleCssImports: Map<string, Array<string>>
): Array<string> {
	const ids: Array<string> = [];

	for ( const moduleId of getTraversalRoots( chunk, getModuleInfo ) ) {
		const cachedCssImports = moduleCssImports.get( moduleId );

		if ( cachedCssImports ) {
			ids.push( ...cachedCssImports );

			continue;
		}

		const traversed = new Set<string>();
		let current = [ moduleId ];

		// Traverse level by level until only CSS modules remain.
		// Non-CSS modules are tracked to avoid loops in cyclic graphs.
		while ( current.some( id => !isCssModule( id ) ) ) {
			const imports: Array<string> = [];

			for ( const id of current ) {
				if ( traversed.has( id ) ) {
					continue;
				}

				if ( isCssModule( id ) ) {
					imports.push( id );
					continue;
				}

				traversed.add( id );

				const moduleInfo = getModuleInfo( id );

				if ( moduleInfo ) {
					imports.push( ...moduleInfo.importedIds );
				}
			}

			current = imports;
		}

		moduleCssImports.set( moduleId, current );
		ids.push( ...current );
	}

	return ids;
}

/**
 * Returns unique CSS modules ordered like they were emitted by `rollup-plugin-styles`.
 */
function getOrderedCssModules( bundle: OutputBundle, getModuleInfo: PluginContext[ 'getModuleInfo' ] ): Array<string> {
	const moduleCssImports = new Map<string, Array<string>>();
	const chunks = Object.values( bundle ).filter( ( output ): output is OutputChunk => {
		return output.type === 'chunk' && ( output.isEntry || output.isDynamicEntry );
	} );

	const ids = chunks.flatMap( chunk => getChunkCssImports( chunk, getModuleInfo, moduleCssImports ) );

	// Keep the last occurrence of each id.
	return [ ...new Set( ids.reverse() ) ].reverse();
}

export function bundleCss( pluginOptions: RollupBundleCssOptions ): Plugin {
	const options: Required<RollupBundleCssOptions> = {
		minify: false,
		sourceMap: false,
		...pluginOptions
	};
	const baseFileName = options.fileName.endsWith( '.css' ) ? options.fileName.slice( 0, -4 ) : options.fileName;
	const editorFileName = `${ baseFileName }-editor.css`;
	const contentFileName = `${ baseFileName }-content.css`;
	type Stylesheet = { css: string; sourceMap?: string };

	return {
		name: 'cke5-bundle-css',

		// Register CSS files as empty JavaScript modules. Their content is read
		// from the file system during bundling in the `generateBundle()` hook.
		load: {
			filter: {
				id: CSS_ID_REGEXP
			},

			handler() {
				return {
					code: '',
					moduleType: 'js'
				};
			}
		},

		async generateBundle( outputOptions, bundle ) {
			const emittedWarnings = new Set<string>();
			const orderedCssModules = getOrderedCssModules( bundle, this.getModuleInfo );
			const editorEntries: Array<string> = [];
			const contentEntries: Array<string> = [];
			const invalidCssModules: Array<string> = [];

			for ( const id of orderedCssModules ) {
				const fileName = basename( normalizeId( id ) );

				if ( fileName === EDITOR_ENTRY_FILE_NAME ) {
					editorEntries.push( id );
				} else if ( fileName === CONTENT_ENTRY_FILE_NAME ) {
					contentEntries.push( id );
				} else {
					invalidCssModules.push( id );
				}
			}

			if ( invalidCssModules.length ) {
				this.error(
					'CSS must be imported through an "index-editor.css" or "index-content.css" entry point. Found:\n' +
					invalidCssModules.map( id => ` - ${ normalizeId( id ) }` ).join( '\n' )
				);
			}

			const projectRoot = outputOptions.file ? dirname( outputOptions.file ) : outputOptions.dir || process.cwd();

			const createEmptyStylesheet = ( fileName: string ): Stylesheet => ( {
				css: '\n',
				sourceMap: options.sourceMap ? JSON.stringify( {
					version: 3,
					file: fileName,
					sources: [],
					sourcesContent: [],
					names: [],
					mappings: ''
				} ) : undefined
			} );

			const bundleStylesheet = async ( entries: Array<string>, fileName: string ): Promise<Stylesheet> => {
				if ( !entries.length ) {
					return createEmptyStylesheet( fileName );
				}

				// Lightning CSS bundles from a single entry file, so create a virtual one
				// that imports CSS modules in the desired order.
				const virtualEntry = entries.map( entry => `@import ${ JSON.stringify( normalizeId( entry ) ) };` ).join( '\n' );
				const result = await bundleAsync( {
					projectRoot,
					filename: VIRTUAL_ENTRY_ID,
					minify: options.minify,
					sourceMap: options.sourceMap,
					include: Features.Nesting,
					resolver: {
						read: ( filePath ): string => {
							if ( filePath === VIRTUAL_ENTRY_ID ) {
								return virtualEntry;
							}

							const normalizedPath = normalizeId( filePath );

							this.addWatchFile( normalizedPath );

							return fs.readFileSync( normalizedPath, 'utf-8' );
						},

						resolve: async ( specifier, originatingFile ): Promise<string> => {
							if ( originatingFile === VIRTUAL_ENTRY_ID ) {
								return specifier;
							}

							const normalizedOrigin = normalizeId( originatingFile );

							if ( isExternalImport( specifier ) ) {
								this.error( `External CSS imports are not supported. Found ${ specifier } in ${ normalizedOrigin }.` );
							}

							// Ask Rolldown so aliases/custom resolvers stay in effect.
							const resolvedByRolldown = await this.resolve( specifier, normalizedOrigin, { skipSelf: true } );

							if ( !resolvedByRolldown ) {
								this.error( `Unable to resolve CSS import ${ specifier } in ${ normalizedOrigin }.` );
							}

							if ( resolvedByRolldown!.external ) {
								this.error( `External CSS imports are not supported. Found ${ specifier } in ${ normalizedOrigin }.` );
							}

							return normalizeId( resolvedByRolldown!.id );
						}
					}
				} );

				emitLightningCssWarnings( this, result.warnings, fileName, emittedWarnings );

				return {
					css: Buffer.from( result.code ).toString(),
					sourceMap: result.map ? Buffer.from( result.map ).toString() : undefined
				};
			};

			const emitStylesheet = ( fileName: string, stylesheet: Stylesheet ): void => {
				let css = stylesheet.css;

				if ( options.sourceMap && stylesheet.sourceMap ) {
					const sourceMapFileName = `${ fileName }.map`;
					const sourceMap = JSON.parse( stylesheet.sourceMap ) as { file?: string };

					sourceMap.file = fileName;
					css += `\n/*# sourceMappingURL=${ basename( sourceMapFileName ) } */`;
					this.emitFile( {
						type: 'asset',
						fileName: sourceMapFileName,
						source: JSON.stringify( sourceMap )
					} );
				}

				this.emitFile( {
					type: 'asset',
					fileName,
					source: css
				} );
			};

			const combinedStylesheet = await bundleStylesheet( orderedCssModules, options.fileName );
			const editorStylesheet = await bundleStylesheet( editorEntries, editorFileName );
			const contentStylesheet = await bundleStylesheet( contentEntries, contentFileName );

			emitStylesheet( options.fileName, combinedStylesheet );
			emitStylesheet( editorFileName, editorStylesheet );
			emitStylesheet( contentFileName, contentStylesheet );
		}
	};
}
