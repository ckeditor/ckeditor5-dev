/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { RepositoryConfig } from '../types.js';
import { logInfo } from './loginfo.js';
import chalk from 'chalk';
import fs from 'fs/promises';
import { removeEmptyDirs } from './removeemptydirs.js';
import upath from 'upath';

interface ChangesetRemoverOptions {
	changesetFilePaths: Array<string>;
	cwd: string;
	changelogDirectory: string;
	externalRepositories: Array<RepositoryConfig>;
}

class ChangesetRemover {
	constructor(private readonly options: ChangesetRemoverOptions) {}

	async remove(): Promise<void> {
		this.logStart();
		await this.removeFiles();
		await this.cleanupDirectories();
	}

	private logStart(): void {
		logInfo(`📍 ${chalk.cyan('Removing the changeset files...')}\n`);
	}

	private async removeFiles(): Promise<void> {
		try {
			await Promise.all(
				this.options.changesetFilePaths.map(file => fs.unlink(file))
			);
		} catch (error) {
			throw new Error(
				`Failed to remove changeset files: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async cleanupDirectories(): Promise<void> {
		try {
			await this.cleanupMainDirectory();
			await this.cleanupExternalDirectories();
		} catch (error) {
			throw new Error(
				`Failed to cleanup directories: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async cleanupMainDirectory(): Promise<void> {
		await removeEmptyDirs(
			upath.join(this.options.cwd, this.options.changelogDirectory)
		);
	}

	private async cleanupExternalDirectories(): Promise<void> {
		await Promise.all(
			this.options.externalRepositories.map(repo =>
				removeEmptyDirs(upath.join(repo.cwd, this.options.changelogDirectory))
			)
		);
	}
}

/**
 * Removes changeset files and cleans up empty directories in both main and external repositories.
 * 
 * @param changesetFilePaths - Array of paths to changeset files to remove
 * @param cwd - Current working directory
 * @param changelogDirectory - Directory containing changelog files
 * @param externalRepositories - Array of external repository configurations
 * @throws {Error} If file removal or directory cleanup fails
 */
export async function removeChangesetFiles(
	changesetFilePaths: Array<string>,
	cwd: string,
	changelogDirectory: string,
	externalRepositories: Array<RepositoryConfig>
): Promise<void> {
	const remover = new ChangesetRemover({
		changesetFilePaths,
		cwd,
		changelogDirectory,
		externalRepositories
	});
	await remover.remove();
}
