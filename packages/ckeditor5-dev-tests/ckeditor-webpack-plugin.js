/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const resolveImportPathInContext = require( './compiler-utils/resolveimportpathincontext' );
const getWorkspaceRelativePathInfo = require( './compiler-utils/getworkspacerelativepathinfo' );
const path = require( 'path' );

class CKEditorWebpackPlugin {
	constructor( options = {} ) {
		this.options = options;
	}

	apply( compiler ) {
		const { packages } = this.options;

		if ( !packages ) {
			return;
		}

		const wildCardPackagePath = packages[ '*' ];

		compiler.plugin( 'after-resolvers', ( compiler ) => {
			compiler.resolvers.normal.plugin( 'before-resolve', ( obj, done ) => {
				const packageName = getWorkspaceRelativePathInfo( obj.request ).packageName;
				const packagePath = packages[ packageName ] || wildCardPackagePath;

				if ( !packagePath ) {
					done();

					return;
				}

				const resolvedPath = resolveImportPathInContext( obj.context.issuer, obj.request, packagePath );

				if ( resolvedPath ) {
					obj.path = resolvedPath.modulesPath;
					obj.request = '.' + path.sep + path.join( resolvedPath.packageName, resolvedPath.filePath );
				}

				done();
			} );
		} );
	}
}

module.exports = CKEditorWebpackPlugin;
