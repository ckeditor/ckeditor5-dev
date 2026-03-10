/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'upath';

export const CHANGELOG_FILE = 'CHANGELOG.md';

export const CHANGELOG_HEADER = 'Changelog\n=========';

export const NPM_URL = 'https://www.npmjs.com/package';

export const VERSIONING_POLICY_URL = 'https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html';

export const CHANGESET_DIRECTORY = '.changelog';

export const PRE_RELEASE_DIRECTORY = 'pre-release';

export const TEMPLATE_FILE: string = path.join( import.meta.dirname, '../template/template.md' );

export const SECTIONS = {
	major: {
		title: `MAJOR BREAKING CHANGES [ℹ️](${ VERSIONING_POLICY_URL }#major-and-minor-breaking-changes)` as string,
		titleInLogs: 'MAJOR BREAKING CHANGES'
	},
	minor: {
		title: `MINOR BREAKING CHANGES [ℹ️](${ VERSIONING_POLICY_URL }#major-and-minor-breaking-changes)` as string,
		titleInLogs: 'MINOR BREAKING CHANGES'
	},
	breaking: { title: 'BREAKING CHANGES' },
	feature: { title: 'Features' },
	fix: { title: 'Bug fixes' },
	other: { title: 'Other changes' },
	warning: {
		title: 'Incorrect values',
		excludeInChangelog: true
	},
	invalid: {
		title: 'Invalid files',
		excludeInChangelog: true
	}
} as const;

export const ISSUE_SLUG_PATTERN: RegExp = /^(?<owner>[a-z0-9.-]+)\/(?<repository>[a-z0-9.-]+)#(?<number>\d+)$/;
export const ISSUE_PATTERN: RegExp = /^\d+$/;
export const ISSUE_URL_PATTERN: RegExp =
	/^(?<base>https:\/\/github\.com)\/(?<owner>[a-z0-9.-]+)\/(?<repository>[a-z0-9.-]+)\/issues\/(?<number>\d+)$/;

export const NICK_NAME_PATTERN: RegExp = /^@[a-z0-9-_]+$/i;

export const TYPES = [
	{ name: 'Feature' },
	{ name: 'Other' },
	{ name: 'Fix' },
	{ name: 'Major breaking change' },
	{ name: 'Minor breaking change' },
	{ name: 'Breaking change' }
] as const;
