/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fsExtra from 'fs-extra';
import upath from 'upath';
import type { PackageJson } from '../types.js';

export async function getPackageJson( cwd = process.cwd() ): Promise<PackageJson> {
	const packageJsonPath = cwd.endsWith( 'package.json' ) ? cwd : upath.join( cwd, 'package.json' );

	return fsExtra.readJson( packageJsonPath );
}
