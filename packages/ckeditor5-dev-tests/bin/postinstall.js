#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const isWsl = require( 'is-wsl' );
const { execSync } = require( 'child_process' );

if ( isWsl ) {
	const executables = [
		require.resolve( 'node-notifier/vendor/snoreToast/snoretoast-x64.exe' ),
		require.resolve( 'node-notifier/vendor/snoreToast/snoretoast-x86.exe' )
	];

	for ( const item of executables ) {
		execSync( `chmod +x ${ item }` );
	}
}
