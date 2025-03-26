/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { RepositoryConfig } from '../types.js';
import { glob } from 'glob';
import upath from 'upath';

interface ChangesetPathsOptions {
	cwd: string;
	changesetsDirectory: string;
	externalRepositories: Array<RepositoryConfig>;
}

interface GlobOptions {
	pattern: string;
	absolute: boolean;
	cwd: string;
}

class ChangesetPathsFinder {
	private readonly defaultGlobOptions: Omit<GlobOptions, 'cwd'> = {
		pattern: '**/*.md',
		absolute: true
	};

	constructor(private readonly options: ChangesetPathsOptions) {}

	/**
	 * Finds all changeset file paths in the main repository and external repositories.
	 * Changeset files are expected to be markdown files (*.md) in the specified changesets directory.
	 * 
	 * @returns Promise resolving to an array of absolute file paths
	 * @throws {Error} If glob pattern matching fails
	 */
	async find(): Promise<Array<string>> {
		try {
			const paths = await this.findPaths();
			return paths.flat();
		} catch (error) {
			throw new Error(
				`Failed to find changeset files: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async findPaths(): Promise<Array<Array<string>>> {
		const paths = await Promise.all([
			this.findMainRepositoryPaths(),
			...this.findExternalRepositoryPaths()
		]);
		return paths;
	}

	private async findMainRepositoryPaths(): Promise<Array<string>> {
		return this.findPathsInDirectory(this.options.cwd);
	}

	private findExternalRepositoryPaths(): Array<Promise<Array<string>>> {
		return this.options.externalRepositories.map(repo =>
			this.findPathsInDirectory(repo.cwd)
		);
	}

	private async findPathsInDirectory(cwd: string): Promise<Array<string>> {
		const globOptions: GlobOptions = {
			...this.defaultGlobOptions,
			cwd: this.getChangesetsPath(cwd)
		};

		try {
			return await glob(globOptions.pattern, globOptions);
		} catch (error) {
			throw new Error(
				`Failed to find changeset files in "${cwd}": ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private getChangesetsPath(cwd: string): string {
		return upath.join(cwd, this.options.changesetsDirectory);
	}
}

/**
 * Finds all changeset file paths in the main repository and external repositories.
 * Changeset files are expected to be markdown files (*.md) in the specified changesets directory.
 * 
 * @param cwd - Current working directory
 * @param changesetsDirectory - Directory containing changeset files
 * @param externalRepositories - Array of external repository configurations
 * @returns Promise resolving to an array of absolute file paths
 * @throws {Error} If glob pattern matching fails
 * 
 * @example
 * const paths = await getChangesetFilePaths(
 *   process.cwd(),
 *   "changelog/changesets",
 *   [{ cwd: "../external-repo" }]
 * );
 */
export async function getChangesetFilePaths(
	cwd: string,
	changesetsDirectory: string,
	externalRepositories: Array<RepositoryConfig>
): Promise<Array<string>> {
	const finder = new ChangesetPathsFinder({
		cwd,
		changesetsDirectory,
		externalRepositories
	});
	return finder.find();
}
