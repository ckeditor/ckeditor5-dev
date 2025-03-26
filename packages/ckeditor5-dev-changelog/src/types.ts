/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { SECTIONS } from './constants.js';

export type SectionName = keyof typeof SECTIONS;

export type Entry = {
	message: string;
	data: FileMetadata & {
		mainContent: string | undefined;
		restContent: Array<string>;
	};
};

type FileMetadata = {
	'breaking-change'?: SectionName;
	type: SectionName;
	scope: Array<string>;
	closes: Array<string>;
	see: Array<string>;
};

export type ParsedFile = {
	content: string;
	data: FileMetadata;
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

export type RepositoryConfig = {
	cwd: string;
	packagesDirectory: string;
};

export type TransformScope = ( name: string ) => {
	displayName: string;
	npmUrl: string;
};

type oneToNine = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type zeroToNine = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type YYYY = `20${ zeroToNine }${ zeroToNine }`;
type MM = `0${ oneToNine }` | `1${ 0 | 1 | 2 }`;
type DD = `0${ oneToNine }` | `${ 1 | 2 }${ zeroToNine }` | `3${ 0 | 1 }`;

export type RawDateString = `${ YYYY }-${ MM }-${ DD }`;
