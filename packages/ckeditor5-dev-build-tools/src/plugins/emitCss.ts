/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Plugin } from 'rollup';

export interface RollupEmitCssOptions {

	/**
	 * Name of the empty CSS files that will be emitted if
	 * no other CSS files were emitted during the build process.
	 */
	fileNames: Array<string>;
}

export function emitCss( pluginOptions: RollupEmitCssOptions ): Plugin {
	return {
		name: 'cke5-emit-css',

		async generateBundle( outputOptions, bundle ) {
			const emittedCss = Object.keys( bundle );

			for ( const fileName of pluginOptions.fileNames ) {
				if ( emittedCss.includes( fileName ) ) {
					continue;
				}

				this.emitFile( {
					type: 'asset',
					fileName,
					source: ''
				} );
			}
		}
	};
}
