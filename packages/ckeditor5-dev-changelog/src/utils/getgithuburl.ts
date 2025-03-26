/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fsExtra from 'fs-extra';
import upath from 'upath';

interface GitHubUrlOptions {
	cwd: string;
}

interface PackageJsonRepository {
	url?: string;
}

interface PackageJson {
	repository?: string | PackageJsonRepository;
}

class GitHubUrlExtractor {
	constructor(private readonly options: GitHubUrlOptions) {}

	/**
	 * Extracts the GitHub URL from the package.json file.
	 * 
	 * @returns Promise resolving to the GitHub URL
	 * @throws {Error} If package.json doesn't exist or doesn't contain a valid GitHub URL
	 */
	async extract(): Promise<string> {
		try {
			const packageJson = await this.readPackageJson();
			return this.parseGitHubUrl(packageJson);
		} catch (error) {
			throw new Error(
				`Failed to extract GitHub URL: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Reads and parses the package.json file.
	 * 
	 * @returns Promise resolving to the parsed package.json content
	 * @throws {Error} If package.json doesn't exist or cannot be parsed
	 */
	private async readPackageJson(): Promise<PackageJson> {
		try {
			const packageJsonPath = upath.join(this.options.cwd, 'package.json');
			return await fsExtra.readJson(packageJsonPath);
		} catch (error) {
			throw new Error(
				`Failed to read package.json: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Parses the GitHub URL from the package.json repository field.
	 * 
	 * @param packageJson - Parsed package.json content
	 * @returns The GitHub URL
	 * @throws {Error} If no valid GitHub URL is found
	 */
	private parseGitHubUrl(packageJson: PackageJson): string {
		const repository = packageJson.repository;
		if (!repository) {
			throw new Error('No repository field found in package.json');
		}

		const url = typeof repository === 'string' ? repository : repository.url;
		if (!url) {
			throw new Error('No URL found in repository field');
		}

		if (!url.includes('github.com')) {
			throw new Error('Repository URL is not a GitHub URL');
		}

		return url;
	}
}

/**
 * Extracts the GitHub URL from the package.json file in the specified directory.
 * 
 * @param cwd - Directory containing package.json
 * @returns Promise resolving to the GitHub URL
 * @throws {Error} If package.json doesn't exist or doesn't contain a valid GitHub URL
 * 
 * @example
 * const githubUrl = await getGitHubUrl({ cwd: "./packages/my-package" });
 */
export async function getGitHubUrl(options: GitHubUrlOptions): Promise<string> {
	const extractor = new GitHubUrlExtractor(options);
	return extractor.extract();
}