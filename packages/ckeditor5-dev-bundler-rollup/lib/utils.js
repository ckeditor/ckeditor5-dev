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
		return files.map( file => {
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
		const filesSummary = filesStats.map( file => {
			return `${ file.name }: ${ prettyBytes( file.size ) } (gzipped: ${ prettyBytes( file.gzippedSize ) })`;
		} ).join( '\n' );

		gutil.log( gutil.colors.green( `\n${ label }:\n${ filesSummary }` ) );
	}
};

module.exports = utils;
