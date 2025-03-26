/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fsExtra from 'fs-extra';
import upath from 'upath';
import type { PackageJson } from '../types.js';

interface PackageJsonOptions {
	cwd?: string;
}

class PackageJsonReader {
	private readonly cwd: string;

	constructor(options: PackageJsonOptions = {}) {
		this.cwd = options.cwd || process.cwd();
	}

	/**
	 * Reads and parses the package.json file from the specified directory.
	 * 
	 * @returns Promise resolving to the parsed package.json content
	 * @throws {Error} If package.json doesn't exist or cannot be parsed
	 */
	async read(): Promise<PackageJson> {
		try {
			const packageJsonPath = this.resolvePackageJsonPath();
			await this.validatePackageJsonExists(packageJsonPath);
			return await this.readPackageJson(packageJsonPath);
		} catch (error) {
			throw new Error(
				`Failed to read package.json: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Resolves the path to package.json based on the current working directory.
	 * If the cwd already points to package.json, returns it as is.
	 * Otherwise, joins the cwd with 'package.json'.
	 * 
	 * @returns Absolute path to package.json
	 */
	private resolvePackageJsonPath(): string {
		return this.cwd.endsWith('package.json')
			? this.cwd
			: upath.join(this.cwd, 'package.json');
	}

	/**
	 * Validates that the package.json file exists at the specified path.
	 * 
	 * @param path - Path to package.json
	 * @throws {Error} If package.json doesn't exist
	 */
	private async validatePackageJsonExists(path: string): Promise<void> {
		const exists = await fsExtra.pathExists(path);
		if (!exists) {
			throw new Error(`Package.json not found at: ${path}`);
		}
	}

	/**
	 * Reads and parses the package.json file.
	 * 
	 * @param path - Path to package.json
	 * @returns Promise resolving to the parsed package.json content
	 * @throws {Error} If package.json cannot be parsed
	 */
	private async readPackageJson(path: string): Promise<PackageJson> {
		try {
			return await fsExtra.readJson(path);
		} catch (error) {
			throw new Error(
				`Failed to parse package.json at ${path}: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}

/**
 * Reads and parses the package.json file from the specified directory.
 * If no directory is specified, uses the current working directory.
 * 
 * @param options - Options for reading package.json
 * @param options.cwd - Directory to look for package.json in (defaults to process.cwd())
 * @returns Promise resolving to the parsed package.json content
 * @throws {Error} If package.json doesn't exist or cannot be parsed
 * 
 * @example
 * // Read package.json from current directory
 * const pkg = await getPackageJson();
 * 
 * // Read package.json from specific directory
 * const pkg = await getPackageJson({ cwd: "./packages/my-package" });
 */
export async function getPackageJson(options: PackageJsonOptions = {}): Promise<PackageJson> {
	const reader = new PackageJsonReader(options);
	return reader.read();
}
