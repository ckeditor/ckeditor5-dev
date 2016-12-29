/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint browser: false, node: true, strict: true */

'use strict';

const resolveImportPathInContext = require( './compiler-utils/resolveimportpathincontext' );
const path = require( 'path' );

class CKEditorWebpackPlugin {
	constructor( options = {} ) {
		this.options = options;
	}

	apply( compiler ) {
		if ( !this.options.useMainPackageModules ) {
			return;
		}

		compiler.plugin( 'after-resolvers', ( compiler ) => {
			compiler.resolvers.normal.plugin( 'before-resolve', ( obj, done ) => {
				const resolvedPath = resolveImportPathInContext( obj.context.issuer, obj.request, this.options.mainPackagePath );

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
