/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */


import { SECTIONS } from './constants';

export type Section = keyof typeof SECTIONS;

export type Entry = {
	message: string
	data: FileMetadata & {
		mainContent: string | undefined
		restContent: string[]
	}
};

type FileMetadata = {
	'breaking-change': Section;
	type: Section;
	section: Section;
	scope: string[];
	closes: string[];
	see: string[];
}

export type ParsedFile = {
	content: string;
	data: FileMetadata
}

export type SectionsWithEntries = Record<Section, {
	entries: Entry[],
	title: string
}>;

export type ReleaseInfo = {
	title: string;
	version: string;
	packages: Array<string>
};

export type PackageJson = {
	name: string,
	version: string
};

export type RepositoryConfig = {
	cwd: string;
	packagesDirectory: string;
};
