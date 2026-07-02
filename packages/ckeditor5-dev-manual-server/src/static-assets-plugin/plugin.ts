/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { readFileSync } from 'node:fs';
import { collectManualStaticAssets, createManualStaticAssetsMiddleware } from './static-assets.js';
import { cacheValue, createPackageNameFilter, stripLeadingSlash } from '../utils.js';
import type { Plugin } from 'vite';

export interface ManualStaticAssetsPluginOptions {
	paths: Array<string>;
	include?: Array<string>;
}

export function manualStaticAssetsPlugin( options: ManualStaticAssetsPluginOptions ): Plugin {
	let workspaceRoot = process.cwd();
	const includePackageNames = ( options.include || [] ).filter( Boolean );
	const manualStaticAssetsCache = cacheValue( () => filterManualStaticAssets(
		collectManualStaticAssets( options.paths, workspaceRoot ),
		includePackageNames
	) );
	const getManualStaticAssets = manualStaticAssetsCache.get;

	return {
		name: 'ckeditor5-manual-static-assets',

		configResolved( config ) {
			workspaceRoot = config.root;
		},

		configureServer( server ) {
			server.middlewares.use( createManualStaticAssetsMiddleware( getManualStaticAssets ) );
		},

		generateBundle() {
			for ( const [ publicPath, filePath ] of getManualStaticAssets() ) {
				this.emitFile( {
					type: 'asset',
					fileName: stripLeadingSlash( publicPath ),
					source: readFileSync( filePath )
				} );
			}
		}
	};
}

function filterManualStaticAssets(
	staticAssets: Map<string, string>,
	includePackageNames: Array<string>
): Map<string, string> {
	const isIncluded = createPackageNameFilter( includePackageNames );

	return new Map( [ ...staticAssets ].filter(
		( [ publicPath ] ) => isIncluded( getManualTestPackageName( publicPath ) )
	) );
}

function getManualTestPackageName( publicPath: string ): string | null {
	return publicPath.match( /^\/(?:.*\/)?([^/]+)\/tests\/manual\// )?.[ 1 ] || null;
}
