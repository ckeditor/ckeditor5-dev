/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import type { ReleaseType } from 'semver';
import type { SectionsWithEntries } from '../types.js';
import { provideNewVersionForMonoRepository } from './providenewversionformonorepository.js';
import { logInfo } from './loginfo.js';

interface VersionOptions {
	sectionsWithEntries: SectionsWithEntries;
	oldVersion: string;
	packageName: string;
}

class VersionDeterminer {
	constructor(private readonly options: VersionOptions) {}

	/**
	 * Determines the new version based on the sections with entries.
	 * The version bump type is determined by the following rules:
	 * - If there are major breaking changes, bump major version
	 * - If there are minor breaking changes or new features, bump minor version
	 * - Otherwise, bump patch version
	 * 
	 * @returns Promise resolving to the new version string
	 * @throws {Error} If version determination fails
	 */
	async determine(): Promise<string> {
		try {
			this.logStart();
			const bumpType = this.determineBumpType();
			return await this.getNewVersion(bumpType);
		} catch (error) {
			throw new Error(
				`Failed to determine new version: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private logStart(): void {
		logInfo(`📍 ${chalk.cyan('Determining the new version...')}\n`);
	}

	/**
	 * Determines the version bump type based on the sections with entries.
	 * 
	 * @returns The type of version bump to apply
	 */
	private determineBumpType(): ReleaseType {
		const { sectionsWithEntries } = this.options;

		if (this.hasMajorChanges(sectionsWithEntries)) {
			return 'major';
		}

		if (this.hasMinorChanges(sectionsWithEntries)) {
			return 'minor';
		}

		return 'patch';
	}

	private hasMajorChanges(sections: SectionsWithEntries): boolean {
		return sections.major.entries.length > 0;
	}

	private hasMinorChanges(sections: SectionsWithEntries): boolean {
		return sections.minor.entries.length > 0 || sections.Feature.entries.length > 0;
	}

	private async getNewVersion(bumpType: ReleaseType): Promise<string> {
		try {
			return await provideNewVersionForMonoRepository({
				version: this.options.oldVersion,
				packageName: this.options.packageName,
				bumpType
			});
		} catch (error) {
			throw new Error(
				`Failed to get new version for bump type "${bumpType}": ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}

/**
 * Determines the new version based on the sections with entries.
 * The version bump type is determined by the following rules:
 * - If there are major breaking changes, bump major version
 * - If there are minor breaking changes or new features, bump minor version
 * - Otherwise, bump patch version
 * 
 * @param sectionsWithEntries - Object containing sections with their entries
 * @param oldVersion - Current version of the package
 * @param packageName - Name of the package
 * @returns Promise resolving to the new version string
 * @throws {Error} If version determination fails
 * 
 * @example
 * const newVersion = await getNewVersion(
 *   {
 *     major: { entries: [] },
 *     minor: { entries: [] },
 *     Feature: { entries: [{ description: "New feature" }] }
 *   },
 *   "1.0.0",
 *   "@ckeditor/ckeditor5-package"
 * );
 */
export async function getNewVersion(
	sectionsWithEntries: SectionsWithEntries,
	oldVersion: string,
	packageName: string
): Promise<string> {
	const determiner = new VersionDeterminer({
		sectionsWithEntries,
		oldVersion,
		packageName
	});
	return determiner.determine();
}
