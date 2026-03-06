/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Buffer } from 'node:buffer';
import { transform } from 'lightningcss';

type LightningCssOptions = {
	minify?: boolean;
	sourceMap?: boolean;
	include?: number;
};

interface MinimalLoaderContext {
	resourcePath: string;
	query?: {
		lightningCssOptions?: LightningCssOptions;
	};
	getOptions?: () => {
		lightningCssOptions?: LightningCssOptions;
	};

	callback( err: Error | null, content?: string | Buffer, sourceMap?: unknown ): void;
}

/**
 * Transforms editor styles using Lightning CSS.
 */
export default function ckLightningCssLoader(
	this: MinimalLoaderContext,
	source: string,
	map: unknown
): void {
	try {
		const loaderOptions = this.getOptions ? this.getOptions() : this.query || {};
		const lightningCssOptions = loaderOptions.lightningCssOptions || {};
		let inputSourceMap: string | undefined;

		if ( typeof map === 'string' ) {
			inputSourceMap = map;
		} else if ( map ) {
			inputSourceMap = JSON.stringify( map );
		}

		const result = transform( {
			filename: this.resourcePath,
			code: Buffer.from( source ),
			inputSourceMap,
			...lightningCssOptions
		} );

		const sourceMap = result.map ? JSON.parse( Buffer.from( result.map ).toString() ) : undefined;

		this.callback( null, Buffer.from( result.code ).toString(), sourceMap );
	} catch ( error ) {
		this.callback( error instanceof Error ? error : new Error( String( error ) ) );
	}
}
