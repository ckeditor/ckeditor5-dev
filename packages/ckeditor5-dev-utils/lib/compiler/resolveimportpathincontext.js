/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );
const getWorkspaceRelativePathInfo = require( './getworkspacerelativepathinfo' );

module.exports = function resolveImportPathInContext( requesterPath, importPath, contextPackagePath ) {
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
};

function ensureExtension( filePath, defaultExt ) {
	if ( !path.extname( filePath ) ) {
		return filePath + defaultExt;
	}

	return filePath;
}
