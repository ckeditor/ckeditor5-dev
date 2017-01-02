/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );
const getWorkspaceRelativePathInfo = require( './getworkspacerelativepathinfo' );

/**
 * Looks for the imported path in context of the requester path and returns informations about it when the request matches some file.
 *
 * @param {String} requesterPath Path to the requester.
 * @param {String} importPath Path to the imported file.
 * @param {Array.<String>} packagePaths Array of node_modules directories and packages where packages will be looking for.
 * @returns {Object|null}
 */
module.exports = function resolveImportPath( requesterPath, importPath, packagePaths ) {
	const requestPackageName = getWorkspaceRelativePathInfo( importPath ).packageName;
	let resolvedPath;

	for ( let contextPackagePath of packagePaths ) {
		if ( resolvedPath ) {
			break;
		}

		const chunks = contextPackagePath.split( path.sep );

		// Current request package is the main package.
		if ( chunks[ chunks.length - 1 ] === requestPackageName ) {
			contextPackagePath = chunks.slice( 0, -1 ).join( path.sep );
		}

		resolvedPath = resolveImportPathInContext( requesterPath, importPath, contextPackagePath );
	}

	return resolvedPath;
};

function resolveImportPathInContext( requesterPath, importPath, contextPackagePath ) {
	const { packageName, filePath } = getWorkspaceRelativePathInfo( importPath );

	if ( !packageName.startsWith( 'ckeditor5-' ) ) {
		return null;
	}

	const packagePath = path.join( contextPackagePath, packageName );
	const modulesPath = path.join( contextPackagePath );

	if ( fs.existsSync( packagePath ) ) {
		return {
			packageName,
			packagePath,
			modulesPath,
			filePath: ensureExtension( filePath, path.extname( requesterPath || 'index.js' ) )
		};
	}

	return null;
}

function ensureExtension( filePath, defaultExt ) {
	if ( !path.extname( filePath ) ) {
		return filePath + defaultExt;
	}

	return filePath;
}
