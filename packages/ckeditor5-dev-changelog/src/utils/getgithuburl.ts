/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { getRepositoryUrl } from './getrepositoryurl.js';

/**
 * Gets the GitHub repository URL from the package.json file.
 *
 * @param cwd - Current working directory (default: process.cwd())
 * @returns The GitHub repository URL
 * @throws {Error} If the package.json doesn't contain a valid GitHub repository URL
 */
export async function getGitHubUrl( cwd = process.cwd() ): Promise<string> {
	const repositoryUrl = await getRepositoryUrl( cwd );
	return extractGitHubUrl( repositoryUrl );
}

/**
 * Extracts the GitHub repository URL from a repository URL.
 *
 * @param repositoryUrl - The repository URL to extract from
 * @returns The GitHub repository URL
 * @throws {Error} If the URL is not a valid GitHub repository URL
 */
function extractGitHubUrl( repositoryUrl: string ): string {
	const githubUrlMatch = repositoryUrl.match( /^https:\/\/github\.com\/([^/]+)\/([^/]+)$/ );

	if ( !githubUrlMatch ) {
		throw new Error( `Invalid GitHub repository URL: ${ repositoryUrl }` );
	}

	return repositoryUrl;
}
