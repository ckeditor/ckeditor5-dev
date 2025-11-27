/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
type GetStylesLoaderOptions = {
    themePath: string;
    minify?: boolean;
    sourceMap?: boolean;
    extractToSeparateFile?: boolean;
    skipPostCssLoader?: boolean;
};
type StylesLoader = {
    test: RegExp;
    use: Array<LoaderToUse>;
};
type LoaderToUse = string | {
    loader: string;
    options?: {
        injectType?: string;
        attributes?: {
            'data-cke': boolean;
        };
        postcssOptions?: object;
    };
};
export default function getStylesLoader(options: GetStylesLoaderOptions): StylesLoader;
export {};
