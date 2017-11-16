/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
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
	loadCoreTranslations,
	maybeLoadPackage,
	maybeAddLoader
};

/**
 * Resolve path to the core's translations and load them.
 *
 * @param {TranslationService} translationService
 * @param {Object} resolver Webpack resolver that can resolve the resource's request.
 */
function loadCoreTranslations( cwd, translationService, resolver ) {
	resolver.resolve( cwd, cwd, '@ckeditor/ckeditor5-core/src/editor/editor.js', ( err, result ) => {
		const pathToCoreTranslationPackage = result.match( CKEditor5CoreRegExp )[ 0 ];

		translationService.loadPackage( pathToCoreTranslationPackage );
	} );
}

/**
 * Add package to the `TranslationService` if the resource comes from `ckeditor5-*` package.
 *
 * @param {TranslationService} translationService
 * @param {String} resource Absolute path to the resource.
 */
function maybeLoadPackage( cwd, translationService, resource ) {
	const relativePathToResource = path.relative( cwd, resource );

	const match = relativePathToResource.match( CKEditor5PackageNameRegExp );

	if ( match ) {
		const index = relativePathToResource.search( CKEditor5PackageNameRegExp ) + match[ 0 ].length;
		const pathToPackage = relativePathToResource.slice( 0, index );

		translationService.loadPackage( pathToPackage );
	}
}

/**
 * Inject loader when the file comes from ckeditor5-* packages.
 *
 * @param {String} resource Absolute path to the resource.
 * @param {Array.<Object>} loaders Array of Webpack loaders.
 */
function maybeAddLoader( cwd, resource, loaders ) {
	const relativePathToResource = path.relative( cwd, resource );

	if ( relativePathToResource.match( CKEditor5PackageSrcFileRegExp ) ) {
		loaders.unshift( path.join( __dirname, 'translatesourceloader.js' ) );
	}
}
