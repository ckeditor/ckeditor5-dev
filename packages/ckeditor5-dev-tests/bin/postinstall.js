#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import isWsl from 'is-wsl';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire( import.meta.url );

if ( isWsl ) {
	const executables = [
		require.resolve( 'node-notifier/vendor/snoreToast/snoretoast-x64.exe' ),
		require.resolve( 'node-notifier/vendor/snoreToast/snoretoast-x86.exe' )
	];

	for ( const item of executables ) {
		execSync( `chmod +x ${ item }` );
	}
}
