/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { SECTIONS } from './constants.js';

/**
 * Configuration options for generating a changelog.
 */
export type GenerateChangelog = {

	/**
	 * The current working directory of the repository.
	 */
	cwd?: string;

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
	 * Function to transform package scopes in the changelog entries.
	 */
	transformScope?: TransformScope;

	/**
	 * The date to use for the changelog entry. Defaults to current date in YYYY-MM-DD format.
	 */
	date?: RawDateString;

	/**
	 * Directory containing the changeset files. Defaults to '.changelog'.
	 */
	changesetsDirectory?: string;

	/**
	 * The organisation namespace to use for the changelog. Defaults to '@ckeditor'.
	 */
	organisationNamespace?: string;

	/**
	 * Whether changelog is for a single package rather than a monorepo.
	 */
	singlePackage?: boolean;

	/**
	 * Whether changelog should be returned by the script instead of saving it to a file.
	 * Using this option will also pick version automatically, instead of asking user.
	 */
	noWrite?: boolean;

	/**
	 * Controls whether changeset files will be deleted after generating changelog.
	 */
	removeInputFiles?: boolean;
};

/**
 * Configuration options for a repository.
 */
export type RepositoryConfig = {

	/**
	 * The current working directory of the repository.
	 */
	cwd: string;

	/**
	 * The directory containing the packages. Defaults to 'packages'.
	 */
	packagesDirectory?: string;

	/**
	 * Whether to skip links in the changelog entries. Defaults to false.
	 */
	skipLinks?: boolean;
};

export type SectionName = keyof typeof SECTIONS;

export type Entry = {
	message: string;
	data: FileMetadata & {
		mainContent: string | undefined;
		restContent: Array<string>;
	};
	changesetPath: string;
};

type FileMetadata = {
	'breaking-change'?: 'major' | 'minor' | boolean;
	type?: string;
	scope?: Array<string>;
	closes?: Array<string>;
	see?: Array<string>;
};

export type ParsedFile = {
	content: string;
	data: FileMetadata;
	changesetPath: string;
	gitHubUrl: string;
	skipLinks: boolean;
};

export type Section = {
	entries: Array<Entry>;
	title: string;
};

export type SectionsWithEntries = Record<SectionName, Section>;

export type ReleaseInfo = {
	title: string;
	version: string;
	packages: Array<string>;
};

export type PackageJson = {
	name: string;
	version: string;
	repository?: string | {
		url: string;
	};
};

export type TransformScope = ( name: string ) => {
	displayName: string;
	npmUrl: string;
};

export type ChangesetPathsWithGithubUrl = {
	changesetPaths: Array<string>;
	gitHubUrl: string;
	skipLinks: boolean;
};

type oneToNine = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type zeroToNine = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type YYYY = `20${ zeroToNine }${ zeroToNine }`;
type MM = `0${ oneToNine }` | `1${ 0 | 1 | 2 }`;
type DD = `0${ oneToNine }` | `${ 1 | 2 }${ zeroToNine }` | `3${ 0 | 1 }`;

export type RawDateString = `${ YYYY }-${ MM }-${ DD }`;
