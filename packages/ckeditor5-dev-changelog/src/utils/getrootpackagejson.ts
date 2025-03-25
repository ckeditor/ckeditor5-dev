/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fsExtra from 'fs-extra';
import upath from 'upath';
import { PackageJson } from '../types';

export async function getRootPackageJson(cwd: string ): Promise<PackageJson> {
	return await fsExtra.readJson( upath.join( cwd, 'package.json' ) );
}
