/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import type { Plugin } from 'rollup';
export interface RollupSplitCssOptions {
    /**
     * Base name of the output css file. This name will be prefixed with `content-` and `editor-`.
     */
    baseFileName: string;
    /**
     * Flag to choose if the output should be minimized or not.
     *
     * @default false
     */
    minimize?: boolean;
}
export declare function splitCss(pluginOptions: RollupSplitCssOptions): Plugin;
