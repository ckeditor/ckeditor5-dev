/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { getPackageJson } from './getpackagejson.js';

/**
 * Gets the repository URL from the package.json file.
 *
 * @param cwd - Current working directory (default: process.cwd())
 * @returns The repository URL without .git suffix and /issues suffix
 * @throws {Error} If the package.json doesn't contain a repository property
 */
export async function getRepositoryUrl( cwd = process.cwd() ): Promise<string> {
	const packageJson = await getPackageJson( cwd );
	const repositoryUrl = extractRepositoryUrl( packageJson );
	return cleanRepositoryUrl( repositoryUrl );
}

/**
 * Extracts the repository URL from the package.json.
 *
 * @param packageJson - The package.json content
 * @returns The raw repository URL
 * @throws {Error} If the package.json doesn't contain a repository property
 */
function extractRepositoryUrl( packageJson: { name: string; repository?: string | { url: string } } ): string {
	const repositoryUrl = typeof packageJson.repository === 'object' ?
		packageJson.repository.url :
		packageJson.repository;

	if ( !repositoryUrl ) {
		throw new Error( `The package.json for "${ packageJson.name }" must contain the "repository" property.` );
	}

	return repositoryUrl;
}

/**
 * Cleans the repository URL by removing .git suffix and /issues suffix.
 *
 * @param url - The repository URL to clean
 * @returns The cleaned repository URL
 */
function cleanRepositoryUrl( url: string ): string {
	return url
		.replace( /\.git$/, '' )
		.replace( /\/issues/, '' );
}
