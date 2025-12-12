/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import type { Plugin, Processor } from 'postcss';
type GetPostCssConfigOptions = {
    /**
     * When true, an inline source map will be built into the output CSS.
     */
    sourceMap?: boolean;
    /**
     * When true, the output CSS will be minified.
     */
    minify?: boolean;
    /**
     * Configuration of the theme-importer PostCSS plugin.
     * See the plugin to learn more.
     */
    themeImporter?: {
        themePath?: string;
        debug?: boolean;
    };
};
type PostCssConfig = {
    /**
     * A PostCSS configuration object, e.g. to be used by the postcss-loader.
     */
    plugins: Array<Plugin | Processor>;
    /**
     * When true, an inline source map will be built into the output CSS.
     */
    sourceMap?: string;
};
/**
 * Returns a PostCSS configuration to build the editor styles (e.g., used by postcss-loader).
 */
export default function getPostCssConfig(options?: GetPostCssConfigOptions): PostCssConfig;
export {};
