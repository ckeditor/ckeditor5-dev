import { Buffer } from 'node:buffer';
import { transform } from 'lightningcss';

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * Transforms editor styles using Lightning CSS.
 */
function ckLightningCssLoader(source, map) {
    try {
        const loaderOptions = this.getOptions ? this.getOptions() : this.query || {};
        const lightningCssOptions = loaderOptions.lightningCssOptions || {};
        const inputSourceMap = typeof map === 'string' ? map : map ? JSON.stringify(map) : undefined;
        const result = transform({
            filename: this.resourcePath,
            code: Buffer.from(source),
            inputSourceMap,
            ...lightningCssOptions
        });
        const sourceMap = result.map ? JSON.parse(Buffer.from(result.map).toString()) : undefined;
        this.callback(null, Buffer.from(result.code).toString(), sourceMap);
    }
    catch (error) {
        this.callback(error instanceof Error ? error : new Error(String(error)));
    }
}

export { ckLightningCssLoader as default };
