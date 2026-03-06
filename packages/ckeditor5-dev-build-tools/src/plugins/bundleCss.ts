/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import { basename, dirname, isAbsolute, resolve } from 'node:path';
import { createFilter } from '@rollup/pluginutils';
import { bundleAsync, Features, type Warning as LightningCssWarning } from 'lightningcss';
import type { OutputBundle, OutputChunk, Plugin, PluginContext, NormalizedOutputOptions } from 'rollup';

export interface RollupBundleCssOptions {

	/**
	 * Name or path of the generated CSS bundle.
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

const filter = createFilter( [ '**/*.css' ] );

const VIRTUAL_ENTRY_ID = '/__cke5_bundle_css__.css';

const QUERY_AND_HASH_REGEXP = /[#?].*$/;

const URL_PROTOCOL_REGEXP = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

const PROTOCOL_RELATIVE_URL_REGEXP = /^\/\//;

/**
 * Removes query strings and hash fragments from the module id.
 */
function normalizeId( id: string ): string {
	return id.replace( QUERY_AND_HASH_REGEXP, '' );
}

/**
 * Builds virtual stylesheet entry containing imports in the provided order.
 */
function createVirtualEntry( filePaths: Array<string> ): { content: string; imports: Map<string, string> } {
	const imports = new Map<string, string>();

	const content = filePaths
		.map( ( filePath, index ) => {
			const importId = `__rollup_bundle_css_${ index }__`;

			imports.set( importId, filePath );

			return `@import ${ JSON.stringify( importId ) };`;
		} )
		.join( '\n' );

	return {
		content,
		imports
	};
}

/**
 * Returns whether the module id points to a CSS file.
 */
function isCssModule( id: string ): boolean {
	return filter( normalizeId( id ) );
}

/**
 * Returns whether the import specifier references an external resource.
 */
function isExternalImport( specifier: string ): boolean {
	return URL_PROTOCOL_REGEXP.test( specifier ) || PROTOCOL_RELATIVE_URL_REGEXP.test( specifier );
}

/**
 * Emits warning diagnostics returned by Lightning CSS.
 */
function emitLightningCssWarnings( context: PluginContext, warnings: Array<LightningCssWarning>, outputFileName: string ): void {
	for ( const warning of warnings ) {
		const warningFileName = warning.loc.filename === VIRTUAL_ENTRY_ID ?
			outputFileName :
			normalizeId( warning.loc.filename );
		const warningLocation = `${ warningFileName }:${ warning.loc.line }:${ warning.loc.column + 1 }`;
		const warningType = warning.type ? ` (${ warning.type })` : '';

		context.warn(
			`Lightning CSS warning in ${ warningLocation }${ warningType }: ${ warning.message }`
		);
	}
}

/**
 * Returns CSS imports from a chunk in the same order as `rollup-plugin-styles`.
 */
function getChunkCssImports( chunk: OutputChunk, getModuleInfo: PluginContext[ 'getModuleInfo' ] ): Array<string> {
	const ids: Array<string> = [];

	for ( const moduleId of Object.keys( chunk.modules ) ) {
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

		ids.push( ...current );
	}

	return ids;
}

/**
 * Returns unique CSS modules ordered like they were emitted by `rollup-plugin-styles`.
 */
function getOrderedCssModules(
	bundle: OutputBundle,
	outputOptions: NormalizedOutputOptions,
	getModuleInfo: PluginContext[ 'getModuleInfo' ]
): Array<string> {
	const chunks = Object.values( bundle ).filter( ( output ): output is OutputChunk => output.type === 'chunk' );
	const manualChunks = chunks.filter( chunk => !chunk.facadeModuleId );
	const emittedChunks = outputOptions.preserveModules ?
		chunks :
		chunks.filter( chunk => chunk.isEntry || chunk.isDynamicEntry );

	const ids: Array<string> = [];
	const moved = new Set<string>();

	// Rollup may move modules from entry chunks to manual chunks.
	// Process manual chunks first to preserve their priority.
	for ( const chunk of manualChunks ) {
		const chunkIds = getChunkCssImports( chunk, getModuleInfo );

		chunkIds.forEach( id => moved.add( id ) );

		ids.push( ...chunkIds );
	}

	// Entry/dynamic chunks can still reference modules already moved above.
	// Skipping them here keeps ordering stable and prevents duplicates.
	for ( const chunk of emittedChunks ) {
		const chunkIds = getChunkCssImports( chunk, getModuleInfo );

		ids.push( ...chunkIds.filter( id => !moved.has( id ) ) );
	}

	// Keep the last occurrence of each id.
	return [ ...new Set( ids.reverse() ) ].reverse();
}

export function bundleCss( pluginOptions: RollupBundleCssOptions ): Plugin {
	const options: Required<RollupBundleCssOptions> = {
		minify: false,
		sourceMap: false,
		...pluginOptions
	};

	const styles = new Map<string, string>();

	return {
		name: 'cke5-bundle-css',

		buildStart() {
			styles.clear();
		},

		transform( code: string, id: string ): string | undefined {
			if ( !isCssModule( id ) ) {
				return;
			}

			styles.set( normalizeId( id ), code );

			return '';
		},

		async generateBundle( outputOptions, bundle ) {
			const orderedCssModules = getOrderedCssModules( bundle, outputOptions, this.getModuleInfo );
			// Lightning CSS bundles from a single entry file, so create a virtual one
			// that imports CSS modules in the desired order.
			const virtualEntry = createVirtualEntry( orderedCssModules );
			const projectRoot = outputOptions.file ? dirname( outputOptions.file ) : outputOptions.dir || process.cwd();

			const result = await bundleAsync( {
				projectRoot,
				filename: VIRTUAL_ENTRY_ID,
				minify: options.minify,
				sourceMap: options.sourceMap,
				include: Features.Nesting,
				resolver: {
					read: ( filePath ): string => {
						if ( filePath === VIRTUAL_ENTRY_ID ) {
							return virtualEntry.content;
						}

						const normalizedPath = normalizeId( filePath );
						const transformedStyles = styles.get( normalizedPath );

						// Prefer styles transformed by earlier Rollup plugins.
						if ( transformedStyles !== undefined ) {
							return transformedStyles;
						}

						// Fallback to raw filesystem reads when transform() did not run.
						this.addWatchFile( normalizedPath );

						return fs.readFileSync( normalizedPath, 'utf-8' );
					},

					resolve: async ( specifier, originatingFile ): Promise<string> => {
						if ( originatingFile === VIRTUAL_ENTRY_ID ) {
							// Virtual entry imports map 1:1 to collected module paths.
							const virtualImportPath = virtualEntry.imports.get( specifier );

							if ( !virtualImportPath ) {
								this.error( `Cannot resolve generated stylesheet entry import: ${ specifier }.` );
							}

							return virtualImportPath!;
						}

						const normalizedOrigin = normalizeId( originatingFile );

						if ( isExternalImport( specifier ) ) {
							this.error( `External CSS imports are not supported. Found ${ specifier } in ${ normalizedOrigin }.` );
						}

						// Ask Rollup first so aliases/custom resolvers stay in effect.
						const resolvedByRollup = await this.resolve( specifier, normalizedOrigin, { skipSelf: true } );

						if ( resolvedByRollup ) {
							if ( resolvedByRollup.external ) {
								this.error( `External CSS imports are not supported. Found ${ specifier } in ${ normalizedOrigin }.` );
							}

							return normalizeId( resolvedByRollup.id );
						}

						if ( isAbsolute( specifier ) ) {
							return specifier;
						}

						if ( specifier.startsWith( '.' ) ) {
							// Keep backward compatibility with relative path resolution.
							return resolve( dirname( normalizedOrigin ), specifier );
						}

						this.error( `Unable to resolve CSS import ${ specifier } in ${ normalizedOrigin }.` );
					}
				}
			} );

			emitLightningCssWarnings( this, result.warnings, options.fileName );

			const sourceMapFileName = `${ options.fileName }.map`;
			let css = Buffer.from( result.code ).toString();

			if ( options.sourceMap && result.map ) {
				const sourceMap = JSON.parse( Buffer.from( result.map ).toString() ) as {
					file?: string;
				};

				// Ensure emitted map references the emitted stylesheet file name.
				sourceMap.file ??= options.fileName;

				css += `\n/*# sourceMappingURL=${ basename( sourceMapFileName ) } */`;

				this.emitFile( {
					type: 'asset',
					fileName: sourceMapFileName,
					source: JSON.stringify( sourceMap )
				} );
			}

			this.emitFile( {
				type: 'asset',
				fileName: options.fileName,
				source: css
			} );
		}
	};
}
