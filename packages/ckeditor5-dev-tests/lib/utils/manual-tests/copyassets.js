/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

const path = require( 'path' );
const fs = require( 'fs-extra' );

const assets = [
	path.join( __dirname, 'togglesidebar.js' ),
	path.join( __dirname, 'attachinspector.js' ),
	require.resolve( '@ckeditor/ckeditor5-inspector' )
];

/*
 * Create the "assets" directory containing global, noncompilable files shared across all manual tests.
 *
 *		build/.manual-tests
 *		├── assets
 *		│   ├── ...
 *		│   └── ...
 *		...
 */
module.exports = function copyAssets( buildDir ) {
	for ( const assetPath of assets ) {
		const outputFilePath = path.join( buildDir, 'assets', path.basename( assetPath ) );
		fs.copySync( assetPath, outputFilePath );
	}
};
