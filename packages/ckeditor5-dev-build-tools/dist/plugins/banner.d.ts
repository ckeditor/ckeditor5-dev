/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import { type FilterPattern } from '@rollup/pluginutils';
import type { Plugin } from 'rollup';
export interface RollupBannerOptions {
    /**
     * Banner that will be added to the top of the output files.
     */
    banner: string;
    /**
     * A valid [picomatch](https://github.com/micromatch/picomatch#globbing-features) pattern,
     * or array of patterns. If omitted or has zero length, all files will have banner added.
     *
     * @default [ '**\/*.js', '**\/*.css', '**\/translations\/**\/*.d.ts' ]
     */
    include?: FilterPattern;
    /**
     * A valid [picomatch](https://github.com/micromatch/picomatch#globbing-features) pattern,
     * or array of patterns. If omitted, no files will be filtered out.
     *
     * @default []
     */
    exclude?: FilterPattern;
}
export declare function addBanner(pluginOptions: RollupBannerOptions): Plugin;
