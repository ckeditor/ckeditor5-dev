/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const webpack = require( 'webpack' );
const bundler = require( '../bundler' );
const styles = require( '../styles' );
const tools = require( '../tools' );

/**
 * Returns a webpack configuration that creates a bundle file for the specified package. Thanks to that, plugins exported
 * by the package can be added to ready-to-use builds.
 *
 * @param {Object} options
 * @param {String} options.themePath An absolute path to the theme package.
 * @param {String} options.packagePath An absolute path to the root directory of the package.
 * @returns {Object}
 */
module.exports = function getPluginWebpackConfig( options ) {
	const packageName = tools.readPackageName( options.packagePath );
	const dllManifestPath = path.join( options.packagePath, '..', '..', 'build', 'ckeditor5-dll.manifest.json' );
	const fileName = getIndexFileName( packageName );

	return {
		mode: 'development',

		devtool: 'source-map',

		performance: { hints: false },

		entry: path.join( options.packagePath, fileName ),

		output: {
			library: [ 'CKEditor5', getGlobalKeyForPackage( packageName ) ],

			path: path.join( options.packagePath, 'build' ),
			filename: fileName,
			libraryTarget: 'umd',
			libraryExport: 'default'
		},

		optimization: {
			minimize: false,
			moduleIds: 'named'
		},

		plugins: [
			new webpack.BannerPlugin( {
				banner: bundler.getLicenseBanner(),
				raw: true
			} ),
			new webpack.DllReferencePlugin( {
				manifest: require( dllManifestPath ),
				scope: 'ckeditor5/src'
			} )
		],

		module: {
			rules: [
				{
					test: /\.svg$/,
					use: [ 'raw-loader' ]
				},
				{
					test: /\.css$/,
					use: [
						{
							loader: 'style-loader',
							options: {
								injectType: 'singletonStyleTag',
								attributes: {
									'data-cke': true
								}
							}
						},
						{
							loader: 'postcss-loader',
							options: styles.getPostCssConfig( {
								themeImporter: {
									themePath: options.themePath
								},
								minify: true
							} )
						}
					]
				}
			]
		}
	};
};

/**
 * Transforms the package name (`@ckeditor/ckeditor5-foo-bar`) to the name that will be used while
 * exporting the library into the global scope.
 *
 * @param {String} packageName
 * @returns {String}
 */
function getGlobalKeyForPackage( packageName ) {
	return packageName
		.replace( /^@ckeditor\/ckeditor5?-/, '' )
		.replace( /-([a-z])/g, ( match, p1 ) => p1.toUpperCase() );
}

/**
 * Extracts the main file name from the package name.
 *
 * @param packageName
 * @returns {String}
 */
function getIndexFileName( packageName ) {
	return packageName.replace( /^@ckeditor\/ckeditor5?-/, '' ) + '.js';
}
