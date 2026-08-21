/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

const INJECTED_CSS_VIRTUAL_ID_PREFIX = '\0virtual:ckeditor5-preserve-css-import-order:';
const INJECTED_CSS_VIRTUAL_ID_SUFFIX = '.js';
const CSS_FILE_REGEXP = /^[^?#]+\.css$/;

/**
 * Preserves the source execution order of CSS imports in manual development and production builds.
 *
 * Vite extracts imported CSS into assets and orders those assets by the generated chunk graph.
 * In a multi-page build that order may differ from the source module execution order, changing
 * the cascade between CKEditor stylesheets. This is a known Vite limitation:
 * https://github.com/vitejs/vite/issues/4890.
 *
 * Until Vite handles this natively (https://github.com/vitejs/vite/pull/22541), plain CSS imports
 * in production builds are replaced with virtual JavaScript modules. Each module loads the
 * processed CSS through Vite's `?inline` query and appends it as a `<style>` side effect.
 * Rolldown's `strictExecutionOrder` keeps both these production effects and Vite's native bundled
 * development CSS effects in source order.
 *
 * Query-bearing CSS imports retain their explicit Vite semantics and pass through unchanged.
 */
export function preserveCssImportOrderPlugin(): Plugin {
	let rewriteCssImports = false;
	const cssFilePaths = new Map<string, string>();

	return {
		name: 'ckeditor5-preserve-css-import-order',

		config( _config, { command } ) {
			rewriteCssImports = command == 'build';

			return {
				build: {
					rolldownOptions: {
						output: {
							strictExecutionOrder: true
						}
					}
				}
			};
		},

		resolveId: {
			order: 'pre',
			filter: {
				id: CSS_FILE_REGEXP
			},

			async handler( source, importer, options ) {
				if ( !rewriteCssImports ) {
					return null;
				}

				const resolved = await this.resolve( source, importer, {
					...options,
					skipSelf: true
				} );

				if ( !resolved || resolved.external ) {
					return null;
				}

				const cssIdHash = createHash( 'sha256' ).update( resolved.id ).digest( 'hex' );
				const virtualId = `${ INJECTED_CSS_VIRTUAL_ID_PREFIX }${ cssIdHash }${ INJECTED_CSS_VIRTUAL_ID_SUFFIX }`;

				cssFilePaths.set( virtualId, resolved.id );

				return virtualId;
			}
		},

		load: {
			filter: {
				id: new RegExp( `^${ INJECTED_CSS_VIRTUAL_ID_PREFIX }` )
			},

			handler( id ) {
				const cssFilePath = cssFilePaths.get( id );

				if ( !cssFilePath ) {
					return null;
				}

				return {
					code: createCssInjectionModule( cssFilePath ),
					moduleSideEffects: true
				};
			}
		}
	};
}

function createCssInjectionModule( cssFilePath: string ): string {
	return `
import css from ${ JSON.stringify( `${ cssFilePath }?inline` ) };

const style = document.createElement( 'style' );
style.textContent = css;
document.head.appendChild( style );
`;
}
