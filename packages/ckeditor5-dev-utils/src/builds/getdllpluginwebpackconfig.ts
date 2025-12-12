/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import path from 'node:path';
import { CKEditorTranslationsPlugin } from '@ckeditor/ckeditor5-dev-translations';
import { getLicenseBanner } from '../bundler/index.js';
import { getIconsLoader, getStylesLoader, getTypeScriptLoader } from '../loaders/index.js';

type WebpackPluginConstructor = {
	new( ...args: Array<unknown> ): object;
};

type WebpackOptions = {

	/**
	 * Plugin used to add text to the top of the file.
	 */
	BannerPlugin: WebpackPluginConstructor;

	/**
	 * Plugin used to import DLLs with webpack.
	 */
	DllReferencePlugin: WebpackPluginConstructor;
};

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
			[ key: string ]: Array<string>;
		};
	};
	module: {
		rules: Array<object>;
	};
	devtool?: string;
};

/**
 * Returns a webpack configuration that creates a bundle file for the specified package. Thanks to that, plugins exported
 * by the package can be added to DLL builds.
 * @returns {object}
 */
export default async function getDllPluginWebpackConfig(
	webpack: WebpackOptions,
	options: GetDllPluginWebpackConfigOptions
): Promise<DllWebpackConfig> {
	// Terser requires webpack. However, it's needed in runtime. To avoid the "Cannot find module 'webpack'" error,
	// let's load the Terser dependency when `getDllPluginWebpackConfig()` is executed.
	// See: https://github.com/ckeditor/ckeditor5/issues/13136.
	const TerserPlugin = ( await import( 'terser-webpack-plugin' ) ).default;

	const { name: packageName } = JSON.parse( fs.readFileSync( path.join( options.packagePath, 'package.json' ), 'utf-8' ) );
	const langDirExists = fs.existsSync( path.join( options.packagePath, 'lang' ) );
	const indexJsExists = fs.existsSync( path.join( options.packagePath, 'src', 'index.js' ) );

	const webpackConfig: DllWebpackConfig = {
		mode: options.isDevelopmentMode ? 'development' : 'production',

		performance: { hints: false },

		// Use the `index.js` file to prepare the build to avoid potential issues if a source code differs from the published one.
		entry: path.join( options.packagePath, 'src', indexJsExists ? 'index.js' : 'index.ts' ),

		output: {
			library: [ 'CKEditor5', getGlobalKeyForPackage( packageName ) ],

			path: path.join( options.packagePath, 'build' ),
			filename: getIndexFileName( packageName ),
			libraryTarget: 'window'
		},

		optimization: {
			minimize: false
		},

		plugins: [
			new webpack.BannerPlugin( {
				banner: getLicenseBanner(),
				raw: true
			} ),
			new webpack.DllReferencePlugin( {
				manifest: JSON.parse( fs.readFileSync( options.manifestPath, 'utf-8' ) ),
				scope: 'ckeditor5/src',
				name: 'CKEditor5.dll'
			} )
		],

		resolve: {
			extensions: [ '.ts', '.js', '.json' ],
			extensionAlias: {
				'.js': [ '.js', '.ts' ]
			}
		},

		module: {
			rules: [
				getIconsLoader( { matchExtensionOnly: true } ),
				getStylesLoader( {
					themePath: options.themePath,
					minify: true
				} ),
				getTypeScriptLoader( {
					configFile: options.tsconfigPath || 'tsconfig.json'
				} )
			]
		}
	};

	// Force loading JS files first if the `index.js` file exists.
	if ( indexJsExists ) {
		webpackConfig.resolve.extensions = moveArrayItem(
			webpackConfig.resolve.extensions,
			webpackConfig.resolve.extensions.indexOf( '.js' ),
			0
		);
	}

	if ( langDirExists ) {
		webpackConfig.plugins.push( new CKEditorTranslationsPlugin( {
			// UI language. Language codes follow the https://en.wikipedia.org/wiki/ISO_639-1 format.
			language: 'en',
			additionalLanguages: 'all',
			sourceFilesPattern: /^src[/\\].+\.[jt]s$/,
			skipPluralFormFunction: true
		} ) );
	}

	if ( options.isDevelopmentMode ) {
		webpackConfig.devtool = 'source-map';
	} else {
		webpackConfig.optimization.minimize = true;

		webpackConfig.optimization.minimizer = [
			new TerserPlugin( {
				terserOptions: {
					output: {
						// Preserve CKEditor 5 license comments.
						comments: /^!/
					}
				},
				extractComments: false
			} )
		];
	}

	return webpackConfig;
}

/**
 * Transforms the package name (`@ckeditor/ckeditor5-foo-bar`) to the name that will be used while
 * exporting the library into the global scope.
 */
function getGlobalKeyForPackage( packageName: string ): string {
	return packageName
		.replace( /^@ckeditor\/ckeditor5?-/, '' )
		.replace( /-([a-z])/g, ( match, p1 ) => p1.toUpperCase() );
}

/**
 * Extracts the main file name from the package name.
 */
function getIndexFileName( packageName: string ): string {
	return packageName.replace( /^@ckeditor\/ckeditor5?-/, '' ) + '.js';
}

function moveArrayItem<T>( source: Array<T>, indexFrom: number, indexTo: number ): Array<T> {
	const tmp = source.slice();
	tmp.splice( indexTo, 0, ...tmp.splice( indexFrom, 1 ) );

	return tmp;
}
