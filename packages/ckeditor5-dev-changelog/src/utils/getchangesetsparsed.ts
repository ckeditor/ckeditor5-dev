/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs/promises';
import matter from 'gray-matter';
import type { ParsedFile } from '../types.js';

interface ChangesetParserOptions {
	changesetFilePaths: Array<string>;
}

class ChangesetParser {
	constructor(private readonly options: ChangesetParserOptions) {}

	/**
	 * Reads and parses changeset files from the provided paths.
	 * Each file is read and parsed using gray-matter to extract frontmatter and content.
	 * 
	 * @returns Promise resolving to an array of parsed files
	 * @throws {Error} If any file cannot be read or parsed
	 */
	async parse(): Promise<Array<ParsedFile>> {
		try {
			const changesetFiles = await this.readChangesetFiles();
			return this.parseChangesetFiles(changesetFiles);
		} catch (error) {
			throw new Error(
				`Failed to process changeset files: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async readChangesetFiles(): Promise<Array<string>> {
		try {
			return await Promise.all(
				this.options.changesetFilePaths.map(file => this.readFile(file))
			);
		} catch (error) {
			throw new Error(
				`Failed to read changeset files: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async readFile(filePath: string): Promise<string> {
		try {
			return await fs.readFile(filePath, 'utf-8');
		} catch (error) {
			throw new Error(
				`Failed to read file "${filePath}": ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private parseChangesetFiles(files: Array<string>): Array<ParsedFile> {
		try {
			return files.map(file => this.parseFile(file));
		} catch (error) {
			throw new Error(
				`Failed to parse changeset files: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private parseFile(content: string): ParsedFile {
		try {
			return matter(content) as unknown as ParsedFile;
		} catch (error) {
			throw new Error(
				`Failed to parse file content: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}

/**
 * Reads and parses changeset files from the provided paths.
 * Each file is read and parsed using gray-matter to extract frontmatter and content.
 * 
 * @param changesetFilePaths - Array of paths to changeset files to parse
 * @returns Promise resolving to an array of parsed files
 * @throws {Error} If any file cannot be read or parsed
 * 
 * @example
 * const parsedFiles = await getChangesetsParsed([
 *   "./changelog/changesets/feature-1.md",
 *   "./changelog/changesets/bugfix-2.md"
 * ]);
 */
export async function getChangesetsParsed(changesetFilePaths: Array<string>): Promise<Array<ParsedFile>> {
	const parser = new ChangesetParser({ changesetFilePaths });
	return parser.parse();
}
