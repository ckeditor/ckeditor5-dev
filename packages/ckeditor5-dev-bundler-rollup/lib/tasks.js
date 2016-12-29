/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const rollup = require( 'rollup' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const fs = require( 'fs' );
const gulp = require( 'gulp' );
const gulpCssnano = require( 'gulp-cssnano' );
const gulpUglify = require( 'gulp-uglify' );
const gutil = require( 'gulp-util' );
const mkdirp = require( 'mkdirp' );
const path = require( 'path' );
const rollupBabel = require( 'rollup-plugin-babel' );
const utils = require( './utils' );
const compiler = require( '@ckeditor/ckeditor5-dev-compiler' );
const streamToPromise = require( 'stream-to-promise' );

const tasks = {
	/**
	 * Main function that takes packages and build config and runs these tasks:
	 * 1. Compiles project
	 * 2. Generates js and css bundles (both normal and minified).
	 * 3. Cleans temp dir
	 *
	 * To create bundle from existing entry point add path to the build config object.
	 * Otherwise add path to editor and list of plugins to the build config plugins.
	 *
	 * @public
	 * @param {Object} config
	 * @param {Array.<String>} config.packages
	 * @param {Object} config.buildConfig
	 * @param {String} config.buildConfig.destinationPath
	 * @param {String} [config.buildConfig.entryPoint]
	 * @param {Array.<String>} [config.buildConfig.plugins]
	 * @param {String} [config.buildConfig.editor]
	 * @param {Object} config.buildConfig.rollupOptions
	 * @param {String} config.buildConfig.rollupOptions.moduleName
	 * @param {String} config.buildConfig.rollupOptions.format
	 * @returns {Promise}
	 */
	build( config ) {
		const fileName = 'ckeditor';
		const sourceBuildDir = 'build/temp-build';

		const { packages, buildConfig } = config;
		const { destinationPath, entryPoint } = buildConfig;

		const generate = entryPoint ?
			tasks._generateBundleWithEntryPoint :
			tasks._generateBundleWithoutEntryPoint;

		return Promise.resolve()
			.then( () => utils.cleanFiles( destinationPath, fileName ) )
			.then( () => tasks._compile( sourceBuildDir, packages ) )
			.then( () => generate( buildConfig, sourceBuildDir, fileName ) )
			.then( () => utils.maybeCleanDir( sourceBuildDir ) )
			.then( () => tasks._minify( destinationPath, fileName ) )
			.then( () => tasks._showSummary( destinationPath, fileName ) );
	},

	/**
	 * Compile editor.
	 *
	 * @protected
	 * @param {String} sourceBuildDir
	 * @param {Array.<String>} packages
	 * @returns {Promise}
	 */
	_compile( sourceBuildDir, packages ) {
		return compiler.tasks.compile( {
			formats: {
				esnext: sourceBuildDir,
			},
			packages,
		} );
	},

	/**
	 * Combine whole editor files into two files `ckeditor.js` and `ckeditor.css`.
	 *
	 * **Note:** Entry file is a physically existing file because rollup requires it.
	 *
	 * @protected
	 * @param {Object} buildConfig Bundle configuration.
	 * @param {String} buildConfig.destinationPath Specify path where bundled editor will be saved.
	 * @param {Array.<String>} buildConfig.plugins List of plugins.
	 * @param {Object} buildConfig.rollupOptions Rollup configuration.
	 * @param {String} sourceBuildDir Temporary directory.
	 * @param {String} fileName Name of the generated editor
	 * @returns {Promise} Promise that resolve bundling for CSS and JS.
	 */
	_generateBundleWithEntryPoint( buildConfig, sourceBuildDir, fileName ) {
		const {
			rollupOptions,
			destinationPath,
			entryPoint,
		} = buildConfig;

		const filePath = path.join( destinationPath, fileName );

		return Promise.all( [
			tasks._generateJsBundle( {
				filePath,
				entryPoint,
				rollupOptions
			} ),

			tasks._generateCssBundle( {
				sourceBuildDir,
				fileName,
				filePath
			} )
		] );
	},

	/**
	 * Combine whole editor files into two files `ckeditor.js` and `ckeditor.css`.
	 *
	 * **Note:** Entry file is a physically existing file because rollup requires it.
	 *
	 * @protected
	 * @param {Object} buildConfig Build configuration.
	 * @param {String} buildConfig.destinationPath Specify path where bundled editor will be saved.
	 * @param {Array.<String>} buildConfig.plugins List of plugins.
	 * @param {Object} buildConfig.rollupOptions Rollup configuration.
	 * @param {String} buildConfig.editor Path to specified editor module.
	 * @param {String} sourceBuildDir Temporary directory.
	 * @param {String} fileName Name of the generated editor.
	 * @returns {Promise} Promise that resolve bundling for CSS and JS.
	 */
	_generateBundleWithoutEntryPoint( buildConfig, sourceBuildDir, fileName ) {
		// Create a temporary entry file with proper directory structure if not exist.
		const {
			rollupOptions,
			destinationPath,
			editor,
			plugins
		} = buildConfig;

		const { moduleName } = rollupOptions;

		const filePath = path.join( destinationPath, fileName );

		const {
			temporaryEntryFilePath: entryPoint,
			bundleTmpDir
		} = tasks._saveLocallyTemporaryEntryFile( {
			destinationPath,
			moduleName,
			sourceBuildDir,
			editor,
			plugins
		} );

		// Lets wait for both - JS and CSS.
		return Promise.all( [
			tasks._generateJsBundle( {
				filePath,
				entryPoint,
				rollupOptions,
				bundleTmpDir,
			} ),

			tasks._generateCssBundle( {
				sourceBuildDir,
				fileName,
				filePath
			} )
		] );
	},

	/**
	 * Create entry file.
	 *
	 * @protected
	 * @param {Object}
	 * @param {String} destiationPath
	 * @param {String} moduleName Module name of CKEditor instance exposed as global variable by a bundle.
	 * @param {String} sourceBuildDir Temporary directory.
	 * @param {String} editor
	 * @param {Array.<String>} plugins
	 */
	_saveLocallyTemporaryEntryFile( { destinationPath, moduleName, sourceBuildDir, editor, plugins } ) {
		mkdirp.sync( destinationPath );

		const bundleTmpDir = fs.mkdtempSync( destinationPath + path.sep );
		// Entry file can not be a stream because rollup requires physically existing file.
		const temporaryEntryFilePath = path.join( bundleTmpDir, 'entryfile.js' );
		fs.writeFileSync( temporaryEntryFilePath, utils.renderEntryFileContent(
			bundleTmpDir,
			{ moduleName, editor, plugins },
			sourceBuildDir
		) );

		return { temporaryEntryFilePath, bundleTmpDir };
	},

	/**
	 * Bundle JS by Rollup.
	 *
	 * @protected
	 * @param {Object}
	 * @param {String} entryPoint
	 * @param {Object} rollupOptions
	 * @param {String} bundleTmpDir
	 */
	_generateJsBundle( { entryPoint, filePath, rollupOptions, bundleTmpDir } ) {
		return Promise.resolve()
			.then( () => tasks._rollupBundle( entryPoint ) )
			.then( bundle => tasks._writeBundle( { bundle, rollupOptions, filePath } ) )
			.then( () => utils.maybeCleanDir( bundleTmpDir ) )
			.catch( err => tasks._handleRollupError( err, bundleTmpDir ) );
	},

	/**
	 * Create rollup bundle for the specified `entryPoint`.
	 *
	 * @protected
	 * @param {String} entryPoint
	 * @returns {Promise}
	 */
	_rollupBundle( entryPoint ) {
		return rollup.rollup( {
			entry: entryPoint,
			plugins: [
				rollupBabel( {
					presets: [
						[
							'es2015',
							{
								modules: false
							}
						]
					],
					plugins: [
						'external-helpers'
					],
				} ),
			]
		} );
	},

	/**
	 * Write bundle to the file.
	 *
	 * @protected
	 * @param {Object} bundle Bundle generated by Rollup.
	 * @param {Function} bundle.write Function that writes bundle into the file.
	 * @param {Object} rollupOptions Rollup configuration.
	 * @returns {Promise}
	 */
	_writeBundle( { bundle, rollupOptions, filePath } ) {
		return bundle.write( Object.assign( {
			format: 'iife',
			dest: `${filePath}.js`,
		}, rollupOptions ) );
	},

	/**
	 * @protected
	 * @param {Error} err
	 * @param {String} bundleTmpDir
	 *
	 * If something went wrong then log error and throw error.
	 */
	_handleRollupError( err, bundleTmpDir ) {
		gutil.log( gutil.colors.red( err.stack ) );

		utils.maybeCleanDir( bundleTmpDir );

		throw new Error( 'Build error.' );
	},

	/**
	 * CSS is already bundled by a build task, so we need only to copy it.
	 *
	 * @protected
	 * @param {Object} options
	 * @param {String} options.sourceBuildDir
	 * @param {String} options.fileName
	 * @param {String} options.filePath
	 * @returns {Promise}
	 */
	_generateCssBundle( { sourceBuildDir, fileName, filePath } ) {
		const cssSource = path.join( sourceBuildDir, 'theme', 'ckeditor.css' );
		const outputDirectory = path.dirname( filePath );

		return tools.copyFile( cssSource, path.join( outputDirectory, `${fileName}.css` ) );
	},

	/**
	 * JS and CSS minification
	 *
	 * @protected
	 * @param {String} filePath Path where the bundled editor will be saved.
	 * @returns {Promise}
	 */
	_minify( destinationPath, fileName ) {
		const filePath = path.join( destinationPath, fileName );

		return Promise.all( [
			streamToPromise( tasks._minifyJs( filePath ) ),
			streamToPromise( tasks._minifyCss( filePath ) )
		] );
	},

	/**
	 * JS minification by UglifyJS.
	 *
	 * @protected
	 * @param {String} filePath Path where the bundled editor will be saved.
	 * @returns {Stream}
	 */
	_minifyJs( filePath ) {
		const stream = gulp.src( `${filePath}.js` )
			.pipe( gulpUglify() );

		return utils.saveFileFromStreamAsMinified( stream, path.dirname( filePath ) );
	},

	/**
	 * CSS minification by cssnano.
	 *
	 * @protected
	 * @param {String} filePath Path where the bundled editor will be saved.
	 * @returns {Stream}
	 */
	_minifyCss( filePath ) {
		const stream = gulp.src( `${filePath}.css` )
			.pipe( gulpCssnano() );

		return utils.saveFileFromStreamAsMinified( stream, path.dirname( filePath ) );
	},

	/**
	 * Show summary of bundling process.
	 *
	 * @protected
	 * @param {String} destinationPath Specify path where bundled editor will be saved.
	 * @param {String} fileName
	 */
	_showSummary( destinationPath, fileName ) {
		const files = [
			`${fileName}.js`,
			`${fileName}.css`,
			`${fileName}.min.js`,
			`${fileName}.min.css`
		];
		const filesStats = utils.getFilesSizeStats( files, destinationPath );

		// Show bundle summary on console.
		utils.showFilesSummary( 'Bundle summary', filesStats );
	}
};

module.exports = tasks;
