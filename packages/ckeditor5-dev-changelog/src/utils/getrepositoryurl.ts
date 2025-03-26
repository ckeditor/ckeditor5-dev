/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { getPackageJson } from './getpackagejson.js';
import type { PackageJson } from '../types.js';

/**
 * Options for extracting the repository URL.
 */
interface RepositoryUrlExtractorOptions {
	/**
	 * The current working directory.
	 * @default process.cwd()
	 */
	cwd?: string;
}

/**
 * A class responsible for extracting and processing repository URLs from package.json.
 */
class RepositoryUrlExtractor {
	private readonly options: RepositoryUrlExtractorOptions;

	/**
	 * Creates a new instance of the RepositoryUrlExtractor.
	 *
	 * @param options - The options for extracting the repository URL.
	 */
	constructor(options: RepositoryUrlExtractorOptions = {}) {
		this.options = {
			cwd: process.cwd(),
			...options
		};
	}

	/**
	 * Gets the repository URL from the package.json file.
	 * The URL is processed to remove any ".git" suffix and "/issues" suffix.
	 *
	 * @returns The processed repository URL.
	 * @throws {Error} If the package.json file is missing or doesn't contain a repository URL.
	 *
	 * @example
	 * ```typescript
	 * const extractor = new RepositoryUrlExtractor();
	 * const url = await extractor.getUrl();
	 * // Returns: "https://github.com/ckeditor/ckeditor5"
	 * ```
	 */
	async getUrl(): Promise<string> {
		try {
			const packageJson = await this.getPackageJson();
			const repositoryUrl = this.extractRepositoryUrl(packageJson);
			return this.processRepositoryUrl(repositoryUrl);
		} catch (error) {
			throw new Error(`Failed to get repository URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Gets the package.json file content.
	 *
	 * @returns The package.json content.
	 * @throws {Error} If the package.json file cannot be read.
	 */
	private async getPackageJson(): Promise<PackageJson> {
		try {
			return await getPackageJson({ cwd: this.options.cwd });
		} catch (error) {
			throw new Error(`Failed to read package.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Extracts the repository URL from the package.json content.
	 *
	 * @param packageJson - The package.json content.
	 * @returns The raw repository URL.
	 * @throws {Error} If the repository URL is missing from package.json.
	 */
	private extractRepositoryUrl(packageJson: PackageJson): string {
		// Due to merging our issue trackers, `packageJson.bugs` will point to the same place for every package.
		// We cannot rely on this value anymore. See: https://github.com/ckeditor/ckeditor5/issues/1988.
		// Instead of we can take a value from `packageJson.repository` and adjust it to match to our requirements.
		const repository = packageJson.repository;
		if (!repository) {
			throw new Error(`The package.json for "${packageJson.name}" must contain the "repository" property.`);
		}

		const repositoryUrl = typeof repository === 'object' ? repository.url : repository;
		if (!repositoryUrl) {
			throw new Error(`The package.json for "${packageJson.name}" must contain a valid repository URL.`);
		}

		return repositoryUrl;
	}

	/**
	 * Processes the repository URL by removing any ".git" suffix and "/issues" suffix.
	 *
	 * @param url - The raw repository URL.
	 * @returns The processed repository URL.
	 */
	private processRepositoryUrl(url: string): string {
		return url
			.replace(/\.git$/, '') // Remove ".git" suffix
			.replace(/\/issues$/, ''); // Remove "/issues" suffix
	}
}

/**
 * Gets the repository URL from the package.json file.
 * The URL is processed to remove any ".git" suffix and "/issues" suffix.
 *
 * @param cwd - The current working directory (default: process.cwd()).
 * @returns The processed repository URL.
 * @throws {Error} If the package.json file is missing or doesn't contain a repository URL.
 *
 * @example
 * ```typescript
 * // Using default working directory
 * const url = await getRepositoryUrl();
 * // Returns: "https://github.com/ckeditor/ckeditor5"
 *
 * // Using custom working directory
 * const url = await getRepositoryUrl('/path/to/project');
 * ```
 */
export async function getRepositoryUrl(cwd = process.cwd()): Promise<string> {
	const extractor = new RepositoryUrlExtractor({ cwd });
	return extractor.getUrl();
}
