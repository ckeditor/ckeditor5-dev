/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { glob, type GlobOptionsWithFileTypesFalse } from 'glob';

/**
 * Options for finding package paths.
 */
interface PackagePathOptions {
	/**
	 * Current working directory.
	 */
	cwd: string;

	/**
	 * Directory containing packages.
	 */
	packagesDirectory: string | null;

	/**
	 * Whether to include package.json files in the results.
	 * @default false
	 */
	includePackageJson?: boolean;

	/**
	 * Whether to include the current working directory in the results.
	 * @default false
	 */
	includeCwd?: boolean;

	/**
	 * Optional filter function for package directories.
	 * @param packageJsonPath - Path to the package.json file
	 * @returns Whether to include the package directory
	 */
	packagesDirectoryFilter?: ((packageJsonPath: string) => boolean) | null;
}

/**
 * A class responsible for finding package paths in a repository.
 */
class PackagePathFinder {
	private readonly options: Required<Omit<PackagePathOptions, 'packagesDirectoryFilter'>> & Pick<PackagePathOptions, 'packagesDirectoryFilter'>;

	/**
	 * Creates a new instance of the PackagePathFinder.
	 *
	 * @param options - Options for finding package paths
	 */
	constructor(options: PackagePathOptions) {
		this.options = {
			cwd: options.cwd,
			packagesDirectory: options.packagesDirectory,
			includePackageJson: options.includePackageJson ?? false,
			includeCwd: options.includeCwd ?? false,
			packagesDirectoryFilter: options.packagesDirectoryFilter ?? null
		};
	}

	/**
	 * Finds all package paths in the repository.
	 *
	 * @returns Promise resolving to an array of package paths
	 * @throws {Error} If glob pattern matching fails
	 */
	async find(): Promise<Array<string>> {
		try {
			const packagePaths = await this.getPackagePaths();
			const normalizedPaths = this.normalizePaths(packagePaths);
			return this.filterPaths(normalizedPaths);
		} catch (error) {
			throw new Error(
				`Failed to find package paths: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Gets all package paths from the packages directory and optionally the current working directory.
	 *
	 * @returns Promise resolving to an array of package paths
	 */
	private async getPackagePaths(): Promise<Array<string>> {
		const packagePaths = await this.getPackagesFromDirectory();

		if (this.options.includeCwd) {
			packagePaths.push(this.getCwdPath());
		}

		return packagePaths;
	}

	/**
	 * Gets package paths from the packages directory.
	 *
	 * @returns Promise resolving to an array of package paths
	 */
	private async getPackagesFromDirectory(): Promise<Array<string>> {
		if (!this.options.packagesDirectory) {
			return [];
		}

		const globOptions: GlobOptionsWithFileTypesFalse = {
			cwd: upath.join(this.options.cwd, this.options.packagesDirectory),
			absolute: true,
			nodir: this.options.includePackageJson
		};

		const pattern = this.options.includePackageJson ? '*/package.json' : '*/';

		try {
			return await glob(pattern, globOptions);
		} catch (error) {
			throw new Error(
				`Failed to find packages in "${this.options.packagesDirectory}": ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Gets the path to include for the current working directory.
	 *
	 * @returns The path to include
	 */
	private getCwdPath(): string {
		return this.options.includePackageJson
			? upath.join(this.options.cwd, 'package.json')
			: this.options.cwd;
	}

	/**
	 * Normalizes all paths to use consistent separators.
	 *
	 * @param paths - Array of paths to normalize
	 * @returns Array of normalized paths
	 */
	private normalizePaths(paths: Array<string>): Array<string> {
		return paths.map(path => upath.normalize(path));
	}

	/**
	 * Filters paths using the provided filter function.
	 *
	 * @param paths - Array of paths to filter
	 * @returns Filtered array of paths
	 */
	private filterPaths(paths: Array<string>): Array<string> {
		return this.options.packagesDirectoryFilter
			? paths.filter(path => this.options.packagesDirectoryFilter!(path))
			: paths;
	}
}

/**
 * Finds all package paths in the repository.
 *
 * @param cwd - Current working directory
 * @param packagesDirectory - Directory containing packages
 * @param options - Additional options for finding package paths
 * @returns Promise resolving to an array of package paths
 * @throws {Error} If glob pattern matching fails
 *
 * @example
 * ```typescript
 * // Find all package directories
 * const paths = await findPathsToPackages(process.cwd(), "packages");
 *
 * // Find all package.json files
 * const paths = await findPathsToPackages(process.cwd(), "packages", {
 *   includePackageJson: true
 * });
 *
 * // Include current working directory
 * const paths = await findPathsToPackages(process.cwd(), "packages", {
 *   includeCwd: true
 * });
 *
 * // Filter package directories
 * const paths = await findPathsToPackages(process.cwd(), "packages", {
 *   packagesDirectoryFilter: path => !path.includes("node_modules")
 * });
 * ```
 */
export async function findPathsToPackages(
	cwd: string,
	packagesDirectory: string | null,
	options: Omit<PackagePathOptions, 'cwd' | 'packagesDirectory'> = {}
): Promise<Array<string>> {
	const finder = new PackagePathFinder({
		cwd,
		packagesDirectory,
		...options
	});
	return finder.find();
}
