/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import fs from 'fs-extra';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire( import.meta.url );
const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

const assets = [
	path.join( __dirname, 'togglesidebar.js' ),
	path.join( __dirname, 'attachinspector.js' ),
	path.join( __dirname, 'websocket.js' ),
	path.join( __dirname, 'globallicensekey.js' ),
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
		fs.copySync( assetPath, outputFilePath );
	}
}
