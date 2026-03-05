/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import type { Plugin } from 'rollup';
export interface RollupTranslationsOptions {
    /**
     * The [glob](https://github.com/isaacs/node-glob) compatible path to the `.po` files.
     *
     * @default '**\/*.po'
     */
    source?: string;
    /**
     * The name of the directory to output all translations to.
     *
     * @default 'translations'
     */
    destination?: string;
}
/**
 * Generates translation files from the `.po` files.
 */
export declare function translations(pluginOptions?: RollupTranslationsOptions): Plugin;
