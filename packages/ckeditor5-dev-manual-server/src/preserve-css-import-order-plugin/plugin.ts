/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Plugin } from 'vite';

const INJECTED_CSS_VIRTUAL_ID_PREFIX = '\0virtual:ckeditor5-preserve-css-import-order:';
const CSS_FILE_REGEXP = /^[^?#]+\.css$/;

/**
 * Preserves the source execution order of CSS imports in production builds.
 *
 * Vite extracts imported CSS into assets and orders those assets by the generated chunk graph.
 * In a multi-page build that order may differ from the source module execution order, changing
 * the cascade between CKEditor stylesheets. This is a known Vite limitation:
 * https://github.com/vitejs/vite/issues/4890.
 *
 * Until Vite handles this natively (https://github.com/vitejs/vite/pull/22541), plain CSS imports
 * are replaced with virtual JavaScript modules. Each module loads the processed CSS through Vite's
 * `?inline` query and appends it as a `<style>` side effect. Rolldown's `strictExecutionOrder` then
 * keeps those effects in source order, matching the ordering model used by bundled development
 * builds.
 *
 * Query-bearing CSS imports retain their explicit Vite semantics and pass through unchanged.
 */
export function preserveCssImportOrderPlugin(): Plugin {
	const cssFilePaths = new Map<string, string>();
	const cssVirtualIds = new Map<string, string>();

	return {
		name: 'ckeditor5-preserve-css-import-order',
		apply: 'build',

		config() {
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

		buildStart() {
			cssFilePaths.clear();
			cssVirtualIds.clear();
		},

		resolveId: {
			order: 'pre',

			handler( source, importer ) {
				if ( !CSS_FILE_REGEXP.test( source ) ) {
					return null;
				}

				return this.resolve( source, importer, { skipSelf: true } ).then( resolved => {
					if ( !resolved || resolved.external ) {
						return null;
					}

					const cachedVirtualId = cssVirtualIds.get( resolved.id );

					if ( cachedVirtualId ) {
						return cachedVirtualId;
					}

					const virtualId = `${ INJECTED_CSS_VIRTUAL_ID_PREFIX }${ cssVirtualIds.size }`;

					cssFilePaths.set( virtualId, resolved.id );
					cssVirtualIds.set( resolved.id, virtualId );

					return virtualId;
				} );
			}
		},

		load( id ) {
			const cssFilePath = cssFilePaths.get( id );

			return cssFilePath ? {
				code: createCssInjectionModule( cssFilePath ),
				moduleSideEffects: true
			} : null;
		}
	};
}

function createCssInjectionModule( cssFilePath: string ): string {
	const hashIndex = cssFilePath.indexOf( '#' );
	const pathAndQuery = hashIndex == -1 ? cssFilePath : cssFilePath.slice( 0, hashIndex );
	const hash = hashIndex == -1 ? '' : cssFilePath.slice( hashIndex );
	const inlineCssFilePath = `${ pathAndQuery }${ pathAndQuery.includes( '?' ) ? '&' : '?' }inline${ hash }`;

	return `
import css from ${ JSON.stringify( inlineCssFilePath ) };

const style = document.createElement( 'style' );
style.textContent = css;
document.head.appendChild( style );
`;
}
