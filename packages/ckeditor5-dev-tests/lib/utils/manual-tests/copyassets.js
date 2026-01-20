/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire( import.meta.url );

const assets = [
	path.join( import.meta.dirname, 'togglesidebar.js' ),
	path.join( import.meta.dirname, 'attachinspector.js' ),
	path.join( import.meta.dirname, 'websocket.js' ),
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
	const outputDir = path.join( buildDir, 'assets' );

	fs.mkdirSync( outputDir, { recursive: true } );

	for ( const assetPath of assets ) {
		const outputFilePath = path.join( outputDir, path.basename( assetPath ) );
		fs.copyFileSync( assetPath, outputFilePath );
	}
}
