/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint browser: false, node: true, strict: true */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );

function resolveImportPathInContext( requesterPath, importPath, contextPackagePath ) {
	const { packageName, filePath } = getImportPathInfo( importPath );

	if ( !packageName.startsWith( 'ckeditor5-' ) ) {
		return null;
	}

	const packagePath = path.join( contextPackagePath, 'node_modules', packageName );
	const modulesPath = path.join( contextPackagePath, 'node_modules' );

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

module.exports = resolveImportPathInContext;

function getImportPathInfo( importPath ) {
	const splitPath = importPath.split( path.sep );

	return {
		packageName: splitPath[ 0 ],
		filePath: path.join.apply( path, splitPath.slice( 1 ) )
	};
}

function ensureExtension( filePath, defaultExt ) {
	if ( !path.extname( filePath ) ) {
		return filePath + defaultExt;
	}

	return filePath;
}
