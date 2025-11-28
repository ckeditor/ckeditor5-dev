/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
type GetDllPluginWebpackConfigOptions = {
    /**
     * An absolute path to the root directory of the package.
     */
    packagePath: string;
    /**
     * An absolute path to the CKEditor 5 DLL manifest file.
     */
    manifestPath: string;
    /**
     * An absolute path to the theme package.
     */
    themePath: string;
    /**
     * An absolute path to the TypeScript configuration file.
     */
    tsconfigPath?: string;
    /**
     * Whether to build a dev mode of the package.
     */
    isDevelopmentMode?: boolean;
};
type DllWebpackConfig = {
    mode: 'development' | 'production';
    performance: object;
    entry: string;
    output: {
        library: Array<string>;
        path: string;
        filename: string;
        libraryTarget: string;
    };
    optimization: {
        minimize: boolean;
        minimizer?: Array<object>;
    };
    plugins: Array<object>;
    resolve: {
        extensions: Array<string>;
        extensionAlias: {
            [key: string]: Array<string>;
        };
    };
    module: {
        rules: Array<object>;
    };
    devtool?: boolean | string;
};
/**
 * Returns a webpack configuration that creates a bundle file for the specified package. Thanks to that, plugins exported
 * by the package can be added to DLL builds.
 * @returns {object}
 */
export default function getDllPluginWebpackConfig(options: GetDllPluginWebpackConfigOptions): Promise<DllWebpackConfig>;
export {};
