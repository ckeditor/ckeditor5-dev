#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import upath from 'upath';

/**
 * Runs `syncpack` (see `.syncpackrc.mjs`) to verify that `dependencies` and `devDependencies`
 * across the repository use consistent versions.
 */
const shouldFix = process.argv[ 2 ] === '--fix';

const ROOT_DIRECTORY = upath.join( import.meta.dirname, '..', '..' );

// The `syncpack` JavaScript entry point is executed through the current Node.js binary,
// because the extensionless `node_modules/.bin` launcher does not work on Windows.
const require = createRequire( import.meta.url );
const syncpackPackagePath = require.resolve( 'syncpack/package.json' );
const syncpackBin = upath.join( upath.dirname( syncpackPackagePath ), require( 'syncpack/package.json' ).bin.syncpack );

const { status } = spawnSync(
	process.execPath,
	[
		syncpackBin,
		shouldFix ? 'fix' : 'lint',
		'--config', upath.join( ROOT_DIRECTORY, '.syncpackrc.mjs' ),
		'--dependency-types', 'prod,dev'
	],
	{
		cwd: ROOT_DIRECTORY,
		stdio: 'inherit'
	}
);

// `status` is `null` when `syncpack` failed to start or was killed by a signal.
process.exit( status ?? 1 );
