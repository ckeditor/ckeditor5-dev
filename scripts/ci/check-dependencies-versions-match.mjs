#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { spawnSync } from 'node:child_process';
import upath from 'upath';

/**
 * Runs `syncpack` (see `.syncpackrc.cjs`) to verify that `dependencies` and `devDependencies`
 * across the repository use consistent versions.
 */
const shouldFix = process.argv[ 2 ] === '--fix';

const ROOT_DIRECTORY = upath.join( import.meta.dirname, '..', '..' );

const { status } = spawnSync(
	upath.join( ROOT_DIRECTORY, 'node_modules', '.bin', 'syncpack' ),
	[
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
