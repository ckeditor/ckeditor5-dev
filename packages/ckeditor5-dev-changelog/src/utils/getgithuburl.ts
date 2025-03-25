/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fsExtra from 'fs-extra';
import upath from 'upath';

export async function getGitHubUrl( cwd: string ): Promise<any> {
	const rootPackageJson = await fsExtra.readJson( upath.join( cwd, 'package.json' ) );
	const githubUrl: string | undefined = rootPackageJson?.repository?.url?.replace( /\.git$/, '' );

	if ( !githubUrl ) {
		console.warn( 'Warning: Git repository not found in root `package.json`, under `repository.url`.' );
	}

	return githubUrl ?? '';
}
