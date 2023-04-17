/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs-extra' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const { CKEditorTranslationsPlugin } = require( '@ckeditor/ckeditor5-dev-translations' );
const bundler = require( '../bundler' );
const tools = require( '../tools' );
const loaders = require( '../loaders' );
const WrapperPlugin = require( 'wrapper-webpack-plugin' );

/**
 * Returns a webpack configuration that creates a bundle file for the specified package. Thanks to that, plugins exported
 * by the package can be added to DLL builds.
 *
 * @param {Object} webpack
 * @param {Function} webpack.BannerPlugin Plugin used to add text to the top of the file.
 * @param {Function} webpack.DllReferencePlugin Plugin used to import DLLs with webpack.
 * @param {Object} options
 * @param {String} options.themePath An absolute path to the theme package.
 * @param {String} options.packagePath An absolute path to the root directory of the package.
 * @param {String} options.manifestPath An absolute path to the CKEditor 5 DLL manifest file.
 * @param {String} [options.tsconfigPath] An absolute path to the TypeScript configuration file.
 * @param {Boolean} [options.isDevelopmentMode=false] Whether to build a dev mode of the package.
 * @returns {Object}
 */
module.exports = function getDllPluginWebpackConfig( webpack, options ) {
	const packageName = tools.readPackageName( options.packagePath );
	const langDirExists = fs.existsSync( path.join( options.packagePath, 'lang' ) );
	const indexTsExists = fs.existsSync( path.join( options.packagePath, 'src', 'index.ts' ) );
	// const dependencies = Array.isArray( options.dependencies || [] ) ? options.dependencies || [] : [ options.dependencies ];
	const globalPackageKey = getGlobalKeyForPackage( packageName );
	const shortPackageName = packageName.replace( /^@ckeditor\//, '' );

	const packageJson = require( path.join( options.packagePath, 'package.json' ) );
	const dependencies = Object.keys( packageJson.dependencies ).filter( dependency => dependency.startsWith( '@ckeditor/' ) );

	const webpackConfig = {
		mode: options.isDevelopmentMode ? 'development' : 'production',

		performance: { hints: false },

		entry: path.join( options.packagePath, 'src', indexTsExists ? 'index.ts' : 'index.js' ),

		output: {
			library: [ 'CKEditor5', 'dll', globalPackageKey ],

			path: path.join( options.packagePath, 'build' ),
			filename: getIndexFileName( packageName ),
			libraryTarget: 'window'
		},

		optimization: {
			minimize: false,
			moduleIds: false
		},

		plugins: [
			// Make sure that module ID include the 'ckeditor5-*' prefix (without '@ckeditor', it's used as a DLL scope).
			new webpack.ids.NamedModuleIdsPlugin( {
				context: path.join( options.packagePath, '..' )
			} ),
			new webpack.BannerPlugin( {
				banner: bundler.getLicenseBanner(),
				raw: true
			} ),
			new webpack.DllReferencePlugin( {
				// Context in 'packages' directory so module IDs use 'ckeditor5-*' prefix.
				context: path.join( options.packagePath, '..' ),
				manifest: require.resolve( 'ckeditor5/build/ckeditor5-dll.manifest.json' ),
				scope: '@ckeditor',
				extensions: [ '.ts', '.js', '.json', '/src/index.ts' ]
			} ),
			...dependencies.map( dependency => (
				// TODO make sure that manifest file can be resolved (should resolve on the webpack.config for a specific package).
				new webpack.DllReferencePlugin( {
					// Context in 'packages' directory so module IDs use 'ckeditor5-*' prefix.
					context: path.join( options.packagePath, '..' ),
					manifest: require( path.join( dependency, 'build', getManifestFileName( dependency + '-dll' ) ) ),
					scope: '@ckeditor',
					extensions: [ '.ts', '.js', '.json', '/src/index.ts' ]
				} )
			) ),
			new webpack.DllPlugin( {
				name: `CKEditor5.dll.${ globalPackageKey }`,
				// Context in 'packages' directory so module IDs use 'ckeditor5-*' prefix.
				context: path.join( options.packagePath, '..' ),
				path: path.join( options.packagePath, 'build', getManifestFileName( packageName + '-dll' ) ),
				format: true,
				entryOnly: true
			} ),
			// Expose contents of DLLs as global, for example `CKEditor5.editorClassic.ClassicEditor`
			new WrapperPlugin( {
				footer: `( window.CKEditor5[ ${ JSON.stringify( globalPackageKey ) } ] = ` +
					`window.CKEditor5.dll[ ${ JSON.stringify( globalPackageKey ) } ]( './${ shortPackageName }/src/index.ts' ) );`
			} )
		],

		resolve: {
			extensions: [ '.ts', '.js', '.json' ]
		},

		module: {
			rules: [
				loaders.getIconsLoader( { matchExtensionOnly: true } ),
				loaders.getStylesLoader( {
					themePath: options.themePath,
					minify: true
				} ),
				loaders.getTypeScriptLoader( {
					configFile: options.tsconfigPath || 'tsconfig.json'
				} )
			]
		}
	};

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

function getManifestFileName( packageName ) {
	return packageName.replace( /^@ckeditor\/ckeditor5?-/, '' ) + '.manifest.json';
}
