/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fsExtra from 'fs-extra';
import upath from 'upath';

export async function getOldVersion( cwd: string ): Promise<string> {
	const rootPackageJson = await fsExtra.readJson( upath.join( cwd, 'package.json' ) );

	return rootPackageJson.version;
}
