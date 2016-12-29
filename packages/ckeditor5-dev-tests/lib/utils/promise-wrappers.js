/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const webpack = require( 'webpack' );
const fs = require( 'fs-extra' );

module.exports = {
	readFile,
	outputFile,
	copyFile,
	runWebpack,
};

/**
 * Promise wrap around fs.readFile.
 *
 * @param {String} file filename.
 * @returns {Promise.<String>}
 */
function readFile( file ) {
	return new Promise( ( resolve, reject ) => {
		fs.readFile( file, 'utf-8', ( err, data ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve( data );
			}
		} );
	} );
}

/**
 * Promise wrap around fs.outputFile.
 *
 * @param {String} file filename.
 * @param {String} data data to save.
 * @returns {Promise.<undefined>}
 */
function outputFile( file, data ) {
	return new Promise( ( resolve, reject ) => {
		fs.outputFile( file, data, ( err ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve();
			}
		} );
	} );
}

/**
 * Promise wrap around fs.copyFile.
 *
 * @param {String} from source.
 * @param {String} to destination.
 * @returns {Promise.<undefined>}
 */
function copyFile( from, to ) {
	return new Promise( ( resolve, reject ) => {
		fs.copy( from, to, ( err ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve();
			}
		} );
	} );
}

/**
 * Promise wrap around webpack function.
 *
 * @param {Object} config webpack config.
 * @returns {Promise.<undefined>}
 */
function runWebpack( config ) {
	return new Promise( ( resolve, reject ) => {
		webpack( config, ( err ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve();
			}
		} );
	} );
}
