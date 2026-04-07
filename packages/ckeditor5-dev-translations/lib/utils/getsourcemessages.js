/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import findMessages from '../findmessages.js';
import getTypeScriptMessages from './gettypescriptmessages.js';
import isFileInDirectory from './isfileindirectory.js';

/**
 * @param {object} options
 * @param {string} [options.cwd=process.cwd()] Current working directory used to locate a TypeScript config.
 * @param {Array.<string>} options.packagePaths An array of paths to packages that contain source files with messages to translate.
 * @param {Array.<string>} options.sourceFiles An array of source files that contain messages to translate.
 * @param {Function} options.onErrorCallback Called when there is an error with parsing the source files.
 * @returns {Array.<TranslatableEntry>}
 */
export default function getSourceMessages( { cwd = process.cwd(), packagePaths, sourceFiles, onErrorCallback } ) {
	const filteredSourceFiles = sourceFiles
		.filter( filePath => packagePaths.some( packagePath => isFileInDirectory( filePath, packagePath ) ) );

	const typeScriptMessages = getTypeScriptMessages( { cwd, sourceFiles: filteredSourceFiles, onErrorCallback } );

	return filteredSourceFiles
		.flatMap( filePath => {
			const packagePath = packagePaths.find( packagePath => isFileInDirectory( filePath, packagePath ) );
			const sourceMessages = typeScriptMessages?.get( filePath ) || typeScriptMessages?.get( filePath.replaceAll( '\\', '/' ) );

			if ( sourceMessages ) {
				return sourceMessages.map( message => ( { filePath, packagePath, ...message } ) );
			}

			const fileContent = fs.readFileSync( filePath, 'utf-8' );
			const fallbackSourceMessages = [];

			findMessages( fileContent, filePath, message => {
				fallbackSourceMessages.push( { filePath, packagePath, ...message } );
			}, onErrorCallback );

			return fallbackSourceMessages;
		} );
}

/**
 * @typedef {object} TranslatableEntry
 *
 * @property {string} id
 * @property {string} string
 * @property {string} filePath
 * @property {string} packagePath
 * @property {string} context
 * @property {string} [plural]
 */
