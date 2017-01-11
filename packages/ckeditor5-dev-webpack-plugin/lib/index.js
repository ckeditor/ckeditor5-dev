/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const resolveImportPath = require( '@ckeditor/ckeditor5-dev-utils/lib/compiler/resolveimportpath' );

module.exports = class CKEditorWebpackPlugin {
	/**
	 * @param {Object} [options]
	 * @param {Array.<String>} [options.packages] Array of directories in which packages will be looked for.
	 */
	constructor( options = {} ) {
		this.options = options;
	}

	apply( compiler ) {
		const packagePaths = this.options.packages;

		if ( !packagePaths || packagePaths.length === 0 ) {
			return;
		}

		compiler.plugin( 'after-resolvers', ( compiler ) => {
			compiler.resolvers.normal.plugin( 'before-resolve', ( obj, done ) => {
				const resolvedPath = resolveImportPath( obj.context.issuer, obj.request, packagePaths );

				if ( resolvedPath ) {
					obj.path = resolvedPath.modulesPath;
					obj.request = '.' + path.sep + path.join( resolvedPath.packageName, resolvedPath.filePath );
				}

				done();
			} );
		} );
	}
};
