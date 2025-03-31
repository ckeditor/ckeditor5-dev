/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import upath from 'upath';
import type { PackageJson } from '../types.js';

/**
 * Reads and returns the contents of the package.json file.
 * This function retrieves the package configuration from the root package.json.
 */
export async function getPackageJson( cwd = process.cwd() ): Promise<PackageJson> {
	return fs.readJson( upath.join( cwd, 'package.json' ) );
}
