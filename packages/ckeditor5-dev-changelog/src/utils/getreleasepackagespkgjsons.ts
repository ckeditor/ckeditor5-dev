/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs/promises';
import upath from 'upath';
import type { RepositoryConfig } from '../types.js';

/**
 * Gets package.json files for all packages to be included in the changelog.
 *
 * @param cwd - Current working directory
 * @param packagesDirectory - Directory containing packages
 * @param externalRepositories - Array of external repository configurations
 * @returns Array of package.json contents
 * @throws {Error} If there's an error reading the package.json files
 */
export async function getReleasePackagesPkgJsons(
	cwd: string,
	packagesDirectory: string,
	externalRepositories: Array<RepositoryConfig>
): Promise<Array<{ name: string; version: string; [key: string]: unknown }>> {
	const packageJsons = await Promise.all( [
		getLocalPackageJsons( cwd, packagesDirectory ),
		...externalRepositories.map( repo => getExternalPackageJsons( repo, packagesDirectory ) )
	] );

	return packageJsons.flat();
}

/**
 * Gets package.json files from the local repository.
 *
 * @param cwd - Current working directory
 * @param packagesDirectory - Directory containing packages
 * @returns Array of package.json contents
 * @throws {Error} If there's an error reading the package.json files
 */
async function getLocalPackageJsons( cwd: string, packagesDirectory: string ): Promise<Array<{ name: string; version: string; [key: string]: unknown }>> {
	const packagesDir = upath.join( cwd, packagesDirectory );
	return getPackageJsonsFromDirectory( packagesDir );
}

/**
 * Gets package.json files from an external repository.
 *
 * @param repo - External repository configuration
 * @param packagesDirectory - Directory containing packages
 * @returns Array of package.json contents
 * @throws {Error} If there's an error reading the package.json files
 */
async function getExternalPackageJsons( repo: RepositoryConfig, packagesDirectory: string ): Promise<Array<{ name: string; version: string; [key: string]: unknown }>> {
	const packagesDir = upath.join( repo.cwd, packagesDirectory );
	return getPackageJsonsFromDirectory( packagesDir );
}

/**
 * Gets all package.json files from a directory.
 *
 * @param directory - Directory to search for package.json files
 * @returns Array of package.json contents
 * @throws {Error} If there's an error reading the package.json files
 */
async function getPackageJsonsFromDirectory( directory: string ): Promise<Array<{ name: string; version: string; [key: string]: unknown }>> {
	try {
		const entries = await fs.readdir( directory, { withFileTypes: true } );
		const packageDirs = entries.filter( entry => entry.isDirectory() );

		const packageJsons = await Promise.all(
			packageDirs.map( async dir => {
				const packageJsonPath = upath.join( directory, dir.name, 'package.json' );
				try {
					const content = await fs.readFile( packageJsonPath, 'utf-8' );
					const packageJson = JSON.parse( content );
					validatePackageJson( packageJson );
					return packageJson;
				} catch ( error ) {
					if ( error instanceof Error && error.message.includes( 'ENOENT' ) ) {
						return null;
					}
					throw new Error( `Invalid package.json in ${ dir.name }: ${ error instanceof Error ? error.message : String( error ) }` );
				}
			} )
		);

		return packageJsons.filter( ( pkg ): pkg is { name: string; version: string; [key: string]: unknown } => pkg !== null );
	} catch ( error ) {
		if ( error instanceof Error && error.message.includes( 'ENOENT' ) ) {
			return [];
		}
		throw new Error( `Could not read packages directory ${ directory }: ${ error instanceof Error ? error.message : String( error ) }` );
	}
}

/**
 * Validates that a package.json has the required fields.
 *
 * @param packageJson - The package.json content to validate
 * @throws {Error} If required fields are missing
 */
function validatePackageJson( packageJson: unknown ): void {
	if ( !packageJson || typeof packageJson !== 'object' ) {
		throw new Error( 'package.json must be an object' );
	}

	const { name, version } = packageJson as Record<string, unknown>;

	if ( !name || typeof name !== 'string' ) {
		throw new Error( 'package.json must contain a "name" field' );
	}

	if ( !version || typeof version !== 'string' ) {
		throw new Error( 'package.json must contain a "version" field' );
	}
}
