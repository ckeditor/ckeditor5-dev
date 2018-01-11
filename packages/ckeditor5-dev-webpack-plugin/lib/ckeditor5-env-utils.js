/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

const CKEditor5CoreRegExp = /.+[/\\]ckeditor5-core/;
const CKEditor5PackageNameRegExp = /[/\\]ckeditor5-[^/\\]+[/\\]/;
const CKEditor5PackageSrcFileRegExp = /[/\\]ckeditor5-[^/\\]+[/\\]src[/\\].+\.js$/;

/**
 * Easily replaceable and testable set of CKEditor5 - related methods used by CKEditorWebpackPlugin internally.
 */
module.exports = {
	getCorePackage,
	getPathToPackage,
	getLoaders
};

/**
 * Return path to the resolved core's translations.
 *
 * @param {String} cwd Current working directory.
 * @param {Object} resolver Webpack resolver that can resolve the resource's request.
 * @returns {Promise<String>}
 */
function getCorePackage( cwd, resolver ) {
	return new Promise( res => {
		resolver.resolve( cwd, cwd, '@ckeditor/ckeditor5-core/src/editor/editor.js', ( err, result ) => {
			const pathToCoreTranslationPackage = result.match( CKEditor5CoreRegExp )[ 0 ];

			res( pathToCoreTranslationPackage );
		} );
	} );
}

/**
 * Return path to the package if the resource comes from `ckeditor5-*` package.
 *
 * @param {String} cwd Current working directory.
 * @param {String} resource Absolute path to the resource.
 * @returns {String|null}
 */
function getPathToPackage( cwd, resource ) {
	const relativePathToResource = path.relative( cwd, resource );

	const match = relativePathToResource.match( CKEditor5PackageNameRegExp );

	if ( !match ) {
		return null;
	}

	const index = relativePathToResource.search( CKEditor5PackageNameRegExp ) + match[ 0 ].length;

	return relativePathToResource.slice( 0, index );
}

/**
 * Inject loader when the file comes from ckeditor5-* packages.
 *
 * @param {String} cwd Current working directory.
 * @param {String} resource Absolute path to the resource.
 * @param {Array.<String|Object>} loaders Array of Webpack loaders.
 * @returns {Array.<String|Object>}
 */
function getLoaders( cwd, resource, loaders ) {
	const relativePathToResource = path.relative( cwd, resource );

	if ( relativePathToResource.match( CKEditor5PackageSrcFileRegExp ) ) {
		return [
			path.join( __dirname, 'translatesourceloader.js' ),
			...loaders
		];
	}

	return loaders;
}
