/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire( import.meta.url );

const assets = [
	path.join( import.meta.dirname, 'togglesidebar.js' ),
	path.join( import.meta.dirname, 'attachinspector.js' ),
	path.join( import.meta.dirname, 'websocket.js' ),
	path.join( import.meta.dirname, 'globallicensekey.js' ),
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
export default function copyAssets( buildDir ) {
	for ( const assetPath of assets ) {
		const outputFilePath = path.join( buildDir, 'assets', path.basename( assetPath ) );

		fs.mkdirSync( path.dirname( outputFilePath ), { recursive: true } );
		fs.copyFileSync( assetPath, outputFilePath );
	}
}
