/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import type { Plugin } from 'rollup';
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
export declare function bundleCss(pluginOptions: RollupBundleCssOptions): Plugin;
