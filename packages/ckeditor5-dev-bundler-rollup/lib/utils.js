/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const gulp = require( 'gulp' );
const gulpRename = require( 'gulp-rename' );
const gutil = require( 'gulp-util' );
const prettyBytes = require( 'pretty-bytes' );
const gzipSize = require( 'gzip-size' );
const minimist = require( 'minimist' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

const utils = {
	/**
	 * Parses command line arguments and returns them as a user-friendly hash.
	 *
	 * @param {String} config Path to the default bundle configuration file.
	 * @returns {Object} options
	 * @returns {String} [options.config] Path to the bundle configuration file.
	 */
	parseArguments( config ) {
		const options = minimist( process.argv.slice( 2 ), {
			string: [
				'config'
			],
			default: {
				config
			}
		} );

		return options;
	},

	/**
	 * When module path is not relative then treat this path as a path to the one of the ckeditor5 default module
	 * (relative to ./bundle/exnext/ckeditor5) and add prefix `./build/esnext/ckeditor5/` to this path.
	 *
	 * This method also adds `.js` extension.
	 *
	 * @param {String} modulePath Path to the module (without extension).
	 * @param {String} buildDir Path to directory where build files are stored.
	 */
	getModuleFullPath( modulePath, buildDir ) {
		// If path is not a relative path (no leading ./ or ../).
		if ( modulePath.charAt( 0 ) != '.' ) {
			return `${ path.join( buildDir, 'ckeditor5', modulePath ) }.js`;
		}

		return modulePath + '.js';
	},

	/**
	 * Resolves a simplified plugin name to a real path if only name is passed.
	 * E.g. 'delete' will be transformed to './build/esnext/ckeditor5/delete/delete.js'.
	 *
	 * @param {String} name
	 * @param {String} buildDir Path to directory where build files are stored.
	 * @returns {String} Path to the module.
	 */
	getPluginPath( name, buildDir ) {
		if ( name.indexOf( '/' ) >= 0 ) {
			return utils.getModuleFullPath( name, buildDir );
		}

		return utils.getModuleFullPath( `${ name }/${ name }`, buildDir );
	},

	/**
	 * Transforms first letter of passed string to the uppercase.
	 *
	 * @param {String} string String that will be transformed.
	 * @returns {String} Transformed string.
	 */
	capitalize( string ) {
		return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
	},

	/**
	 * Clean directory if the path to directory is provided
	 *
	 * @param {String} [dir]
	 * @returns {Promise}
	 */
	maybeCleanDir( dir ) {
		return ( dir ) ?
			tools.clean( dir, path.join( '' ) ) :
			Promise.resolve();
	},

	/**
	 * Remove all files from bundle directory.
	 *
	 * @param {String} destinationPath Specify path where bundled editor will be saved.
	 * @param {String} fileName Name of the file.
	 * @returns {Promise}
	 */
	cleanFiles( destinationPath, fileName ) {
		return tools.clean( destinationPath, `${fileName}.*` );
	},

	/**
	 * Renders content for the entry file which needs to be passed as main file to the Rollup.
	 *
	 * @param {String} dir Path to the entryfile directory. Import paths need to be relative to this directory.
	 * @param {Object} data Configuration object.
	 * @param {String} [data.moduleName] Name of the editor class exposed as global variable by bundle. e.g. MyCKEditor.
	 * @param {String} [data.editor] Path to the editor type e.g. `classic-editor/classic.js`.
	 * @param {Array.<String>} [data.plugins] List of paths or names to plugins which need to be included in bundle.
	 * @param {String} buildDir Path to directory where build files are stored.
	 * @returns {String} Entry file content.
	 */
	renderEntryFileContent( dir, data, buildDir ) {
		const creatorName = utils.capitalize( path.basename( data.editor, '.js' ) );
		const creatorPath = path.relative( dir, utils.getModuleFullPath( data.editor, buildDir ) );
		let pluginNames = [];

		// Returns a list of plugin imports.
		function renderPluginImports( plugins = [] ) {
			let templateFragment = '';

			for ( let plugin of plugins ) {
				plugin = utils.getPluginPath( plugin, buildDir );

				const pluginPath = path.relative( dir, plugin );

				// Generate unique plugin name.
				// In case of two ore more plugins will have the same name:
				// 		plugins: [
				// 			'typing',
				// 			'path/to/other/plugin/typing'
				// 		]
				let pluginName = utils.capitalize( path.basename( plugin, '.js' ) );
				let i = 0;

				while ( pluginNames.indexOf( pluginName ) >= 0 ) {
					pluginName = utils.capitalize( path.basename( plugin, `.js` ) ) + ( ++i ).toString();
				}

				templateFragment += `import ${ pluginName } from '${ pluginPath }';\n`;
				pluginNames.push( pluginName );
			}

			return templateFragment;
		}

		return `
'use strict';

// Babel helpers.
import '${ path.relative( dir, 'node_modules/regenerator-runtime/runtime.js' ) }';

import ${ creatorName } from '${ creatorPath }';
${ renderPluginImports( data.plugins ) }

export default class ${ data.moduleName } extends ${ creatorName } {
	static create( element, config = {} ) {
		if ( !config.plugins ) {
			config.plugins = [];
		}

		config.plugins = [ ...config.plugins, ${ pluginNames.join( ', ' ) } ];

		return ${ creatorName }.create( element, config );
	}
}
`;
	},

	/**
	 * Saves files from stream in specific destination and add `.min` suffix to the name.
	 *
	 * @param {Stream} stream Source stream.
	 * @param {String} destination Path to the destination directory.
	 * @returns {Stream}
	 */
	saveFileFromStreamAsMinified( stream, destination ) {
		return stream
			.pipe( gulpRename( {
				suffix: '.min'
			} ) )
			.pipe( gulp.dest( destination ) );
	},

	/**
	 * Gets size of the file.
	 *
	 * @param {String} path Path to the file.
	 * @returns {Number} Size in bytes.
	 */
	getFileSize( path ) {
		return fs.statSync( path ).size;
	},

	/**
	 * Gets human readable gzipped size of the file.
	 *
	 * @param {String} path Path to the file.
	 * @returns {Number} Size in bytes.
	 */
	getGzippedFileSize( path ) {
		return gzipSize.sync( fs.readFileSync( path ) );
	},

	/**
	 * Gets normal and gzipped size of every passed file in specified directory.
	 *
	 * @param {Array.<String>} files List of file paths.
	 * @param {String} [rootDir=''] When each file is in the same directory.
	 * @returns {Array.<Object>} List with file size data.
	 *
	 * Objects contain the following fields:
	 *
	 * * name – File name.
	 * * size – File size in human readable format.
	 * * gzippedSize – Gzipped file size in human readable format.
	 */
	getFilesSizeStats( files, rootDir = '' ) {
		return files.map( ( file ) => {
			const filePath = path.join( rootDir, file );

			return {
				name: path.basename( filePath ),
				size: utils.getFileSize( filePath ),
				gzippedSize: utils.getGzippedFileSize( filePath )
			};
		} );
	},

	/**
	 * Prints on console summary with a list of files with their size stats.
	 *
	 *		Title:
	 *		file.js: 1 MB (gzipped: 400 kB)
	 *		file.css 500 kB (gzipped: 100 kB)
	 *
	 * @param {String} title Summary title.
	 * @param {Array.<Object>} filesStats
	 */
	showFilesSummary( title, filesStats ) {
		const label = gutil.colors.underline( title );
		const filesSummary = filesStats.map( ( file ) => {
			return `${ file.name }: ${ prettyBytes( file.size ) } (gzipped: ${ prettyBytes( file.gzippedSize ) })`;
		} ).join( '\n' );

		gutil.log( gutil.colors.green( `\n${ label }:\n${ filesSummary }` ) );
	}
};

module.exports = utils;
