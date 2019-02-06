/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
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
	getCorePackageSampleResource,
	getCorePackagePath,
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

/**
 * Returns sample resource in CKEditor5-core.
 *
 * @returns {String}
 */
function getCorePackageSampleResource() {
	return '@ckeditor/ckeditor5-core/src/editor/editor.js';
}

/**
 * Returns path to the core package.
 *
 * @param {String} resource Sample resource.
 * @returns {String}
 */
function getCorePackagePath( resource ) {
	return resource.match( CKEditor5CoreRegExp )[ 0 ];
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
 * @param {Object} options Options for the new loader.
 * @returns {Array.<String|Object>}
 */
function getLoaders( cwd, resource, loaders, options ) {
	const relativePathToResource = path.relative( cwd, resource );

	if ( relativePathToResource.match( CKEditor5PackageSrcFileRegExp ) ) {
		return [
			{
				loader: path.join( __dirname, 'translatesourceloader.js' ),
				options
			},
			...loaders
		];
	}

	return loaders;
}
