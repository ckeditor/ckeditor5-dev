/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { PackageJson, RepositoryConfig } from '../types.js';
import { findPathsToPackages } from './findpathstopackages.js';
import fsExtra from 'fs-extra';
import upath from 'upath';

interface PackageJsonReaderOptions {
	cwd: string;
	packagesDirectory: string;
	externalRepositories: Array<RepositoryConfig>;
}

class PackageJsonReader {
	constructor(private readonly options: PackageJsonReaderOptions) {}

	/**
	 * Reads package.json files from all packages in the main repository and external repositories.
	 * 
	 * @returns Promise resolving to an array of parsed package.json contents
	 * @throws {Error} If any package.json cannot be read or parsed
	 */
	async read(): Promise<Array<PackageJson>> {
		try {
			const packagesPaths = await this.findPackagesPaths();
			return await this.readPackagesJson(packagesPaths);
		} catch (error) {
			throw new Error(
				`Failed to read package.json files: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Finds paths to all packages in the main repository and external repositories.
	 * 
	 * @returns Promise resolving to an array of package paths
	 */
	private async findPackagesPaths(): Promise<Array<string>> {
		const externalPackagesPromises = this.options.externalRepositories.map(repository =>
			findPathsToPackages(repository.cwd, repository.packagesDirectory)
		);

		const packagesPaths = await Promise.all([
			findPathsToPackages(this.options.cwd, this.options.packagesDirectory, { includeCwd: true }),
			...externalPackagesPromises
		]);

		return packagesPaths.flat();
	}

	/**
	 * Reads and parses package.json files from the provided package paths.
	 * 
	 * @param packagesPaths - Array of paths to packages
	 * @returns Promise resolving to an array of parsed package.json contents
	 * @throws {Error} If any package.json cannot be read or parsed
	 */
	private async readPackagesJson(packagesPaths: Array<string>): Promise<Array<PackageJson>> {
		try {
			const packagesPromises = packagesPaths.map(packagePath =>
				this.readPackageJson(packagePath)
			);
			return await Promise.all(packagesPromises);
		} catch (error) {
			throw new Error(
				`Failed to read package.json files: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Reads and parses a single package.json file.
	 * 
	 * @param packagePath - Path to the package directory
	 * @returns Promise resolving to the parsed package.json content
	 * @throws {Error} If package.json cannot be read or parsed
	 */
	private async readPackageJson(packagePath: string): Promise<PackageJson> {
		try {
			const packageJsonPath = upath.join(packagePath, 'package.json');
			return await fsExtra.readJson(packageJsonPath);
		} catch (error) {
			throw new Error(
				`Failed to read package.json at "${packagePath}": ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}

/**
 * Reads package.json files from all packages in the main repository and external repositories.
 * 
 * @param cwd - Current working directory
 * @param packagesDirectory - Directory containing packages
 * @param externalRepositories - Array of external repository configurations
 * @returns Promise resolving to an array of parsed package.json contents
 * @throws {Error} If any package.json cannot be read or parsed
 * 
 * @example
 * const packageJsons = await getReleasePackagesPkgJsons(
 *   process.cwd(),
 *   "packages",
 *   [{ cwd: "../external-repo", packagesDirectory: "packages" }]
 * );
 */
export async function getReleasePackagesPkgJsons(
	cwd: string,
	packagesDirectory: string,
	externalRepositories: Array<RepositoryConfig>
): Promise<Array<PackageJson>> {
	const reader = new PackageJsonReader({
		cwd,
		packagesDirectory,
		externalRepositories
	});
	return reader.read();
}
