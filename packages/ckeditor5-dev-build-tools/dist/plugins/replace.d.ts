/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import type { Plugin } from 'rollup';
export interface RollupReplaceOptions {
    /**
     * Array containing tuples of pattern and replace value. RegExp must have the `/g` flag.
     *
     * @example
     * [
     *   [ 'find', 'replace' ],
     *   [ /find/g, 'replace' ]
     * ]
     *
     * If the third element is set to `true`, the replacement will be done BEFORE bundling,
     * meaning that the import will be replaced in the source code, not only in the resulting bundle.
     *
     * @default []
     */
    replace: Array<[RegExp | string, string, true?]>;
}
export declare function replaceImports(pluginOptions: RollupReplaceOptions): Plugin;
