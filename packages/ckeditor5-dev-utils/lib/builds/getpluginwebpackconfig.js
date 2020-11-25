/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const webpack = require( 'webpack' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const bundler = require( '../bundler' );
const styles = require( '../styles' );
const tools = require( '../tools' );

/**
 * @param {Object} options
 * @param {String} options.themePath Configuration of the theme-importer PostCSS plugin.
 * @param {String} options.packagePath An absolute path to the root directory of the package.
 * @param {'production'|'development'} [options.mode='production'] Type of the bundle.
 * @returns {Object}
 */
module.exports = function getPluginWebpackConfig( options ) {
	const packageName = tools.readPackageName( options.packagePath );

	return {
		mode: options.mode || 'production',

		devtool: 'source-map',

		performance: { hints: false },

		entry: path.join( options.packagePath, 'src', 'index.js' ),

		output: {
			library: [ 'CKEditor5', getShortPackageName( packageName ) ],

			path: path.join( options.packagePath, 'dist' ),
			filename: 'ckeditor.js',
			libraryTarget: 'umd',
			libraryExport: 'default'
		},

		optimization: {
			minimizer: [
				new TerserPlugin( {
					sourceMap: true,
					terserOptions: {
						output: {
							// Preserve CKEditor 5 license comments.
							comments: /^!/
						}
					},
					extractComments: false
				} )
			]
		},

		plugins: [
			new webpack.BannerPlugin( {
				banner: bundler.getLicenseBanner(),
				raw: true
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
 * @param {String} packageName
 * @returns {String}
 */
function getShortPackageName( packageName ) {
	return packageName
		.replace( /^@ckeditor\/ckeditor5?-/, '' )
		.replace( /-([a-z])/g, ( match, p1 ) => p1.toUpperCase() );
}
