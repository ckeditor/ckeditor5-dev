/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { SECTIONS } from './utils/constants.js';

export type ConfigBase = RepositoryConfig & {

	/**
	 * The next version number to use. If not provided, will be calculated based on changes.
	 * Can be a semver string or 'internal' for internal changes only.
	 */
	nextVersion?: string | 'internal';

	/**
	 * Array of external repository configurations to include in the changelog.
	 */
	externalRepositories?: Array<RepositoryConfig>;

	/**
	 * The date to use for the changelog entry. Defaults to current date in YYYY-MM-DD format.
	 */
	date?: string;
};

export type MonoRepoConfigBase = {

	/**
	 * Function to transform package scopes in the changelog entries.
	 */
	transformScope?: TransformScope;

	/**
	 * Whether to include the root package name in the bumped packages versions section in the changelog.
	 */
	shouldIgnoreRootPackage?: unknown;

	/**
	 * The package that will be used when determining if the next version is available on npm.
	 */
	npmPackageToCheck?: unknown;
} & NpmPackageRequiredWhenSkipRootPackage;

export type RepositoryConfig = {

	/**
	 * The current working directory of the repository.
	 */
	cwd: string;

	/**
	 * The directory containing the packages. Defaults to 'packages'.
	 */
	packagesDirectory: null | string;

	/**
	 * Whether to skip links in the changelog entries. Defaults to false.
	 */
	shouldSkipLinks?: boolean;
};

export type GenerateChangelogEntryPoint<K extends object> = <T extends boolean | undefined = undefined>(
	config: K & {

		/**
		 * Controls whether changeset files will be deleted after generating changelog.
		 */
		disableFilesystemOperations?: T;
	}
) => Promise<T extends true ? string : void>; // eslint-disable-line @typescript-eslint/no-invalid-void-type

export type SectionName = keyof typeof SECTIONS;

export type Entry = {
	message: string;
	data: {
		type: string;
		scope: Array<string>;
		mainContent: string | undefined;
		restContent: Array<string>;
		communityCredits: Array<string>;
		validations: Array<string>;
		see: Array<LinkObject>;
		closes: Array<LinkObject>;
	};
	changesetPath: string;
};

export type ParsedFile<T = FileMetadata> = {
	content: string;
	data: T;
	changesetPath: string;
	gitHubUrl: string;
	shouldSkipLinks: boolean;
};

export type Section = {
	entries: Array<Entry>;
	title: string;
	titleInLogs?: string;
	excludeInChangelog?: boolean;
};

export type SectionsWithEntries = Record<SectionName, Section>;

export type ReleaseInfo = {
	title: string;
	version: string;
	packages: Array<string>;
};

export type TransformScope = ( name: string ) => {
	displayName: string;
	npmUrl: string;
};

export type ChangesetPathsWithGithubUrl = {
	filePaths: Array<string>;
	gitHubUrl: string;
	shouldSkipLinks: boolean;
	cwd: string;
	isRoot: boolean;
};

type NpmPackageRequiredWhenSkipRootPackage = {
	shouldIgnoreRootPackage?: true;
	npmPackageToCheck: string;
} | {
	shouldIgnoreRootPackage?: false;
	npmPackageToCheck?: never;
};

export type LinkObject = { displayName: string; link: string };

export type FileMetadata = {
	type: string;
	scope: Array<string>;
	closes: Array<string>;
	see: Array<string>;
	communityCredits: Array<string>;
	validations: Array<string>;
};
