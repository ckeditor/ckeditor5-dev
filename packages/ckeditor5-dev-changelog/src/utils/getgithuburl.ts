/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fsExtra from 'fs-extra';
import upath from 'upath';

/**
 * Retrieves the GitHub repository URL from the package.json file.
 * This function extracts the repository URL from the package.json configuration.
 */
export async function getGitHubUrl( cwd: string ): Promise<string> {
	const rootPackageJson = await fsExtra.readJson( upath.join( cwd, 'package.json' ) );
	const githubUrl: string | undefined = rootPackageJson?.repository?.url?.replace( /\.git$/, '' );

	if ( !githubUrl ) {
		console.warn( 'Warning: The GitHub repository URL (`repository.url`) is not defined in root `package.json`.' );

		return '';
	}

	return githubUrl;
}
