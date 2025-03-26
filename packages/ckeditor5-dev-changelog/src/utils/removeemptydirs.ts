/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fsExtra from 'fs-extra';
import fs from 'fs/promises';
import upath from 'upath';

class EmptyDirectoryRemover {
	constructor(private readonly directory: string) {}

	async remove(): Promise<void> {
		if (!this.directoryExists()) {
			return;
		}

		await this.processDirectory();
	}

	private directoryExists(): boolean {
		return fsExtra.existsSync(this.directory);
	}

	private async processDirectory(): Promise<void> {
		try {
			const files = await this.getDirectoryContents();
			await this.processSubdirectories(files);
			await this.removeIfEmpty();
		} catch (error) {
			throw new Error(
				`Failed to process directory "${this.directory}": ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async getDirectoryContents(): Promise<Array<string>> {
		return fs.readdir(this.directory);
	}

	private async processSubdirectories(files: Array<string>): Promise<void> {
		for (const file of files) {
			const fullPath = upath.join(this.directory, file);
			if (await this.isDirectory(fullPath)) {
				await this.removeSubdirectory(fullPath);
			}
		}
	}

	private async isDirectory(path: string): Promise<boolean> {
		return (await fs.stat(path)).isDirectory();
	}

	private async removeSubdirectory(path: string): Promise<void> {
		const remover = new EmptyDirectoryRemover(path);
		await remover.remove();
	}

	private async removeIfEmpty(): Promise<void> {
		const files = await this.getDirectoryContents();
		if (files.length === 0) {
			await fs.rmdir(this.directory);
		}
	}
}

/**
 * Recursively removes empty directories starting from the specified directory.
 * A directory is considered empty if it contains no files or subdirectories.
 * 
 * @param directory - Path to the directory to process
 * @throws {Error} If directory processing fails
 * 
 * @example
 * await removeEmptyDirs("./changelog") // Removes all empty directories under ./changelog
 */
export async function removeEmptyDirs(directory: string): Promise<void> {
	const remover = new EmptyDirectoryRemover(directory);
	await remover.remove();
}
