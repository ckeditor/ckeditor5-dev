/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export const CHANGELOG_FILE = 'CHANGELOG.md';

export const CHANGELOG_HEADER = 'Changelog\n=========';

export const NPM_URL = 'https://www.npmjs.com/package';

export const VERSIONING_POLICY_URL = 'https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html';

export const PACKAGES_DIRECTORY_NAME = 'packages';

export const ORGANISATION_NAMESPACE = '@ckeditor';

export const CHANGESET_DIRECTORY = '.changelog';

export const SECTIONS = {
	major: { title: `MAJOR BREAKING CHANGES [ℹ️](${ VERSIONING_POLICY_URL }#major-and-minor-breaking-changes)` },
	minor: { title: `MINOR BREAKING CHANGES [ℹ️](${ VERSIONING_POLICY_URL }#major-and-minor-breaking-changes)` },
	breaking: { title: 'BREAKING CHANGES' },
	feature: { title: 'Features' },
	fix: { title: 'Bug fixes' },
	other: { title: 'Other changes' },
	invalid: { title: 'incorrectly defined input files' }
} as const;

export const ISSUE_SLUG_PATTERN = /^(?<owner>[a-z0-9.-]+)\/(?<repository>[a-z0-9.-]+)#(?<number>\d+)$/;
export const ISSUE_PATTERN = /^\d+$/;
export const ISSUE_URL_PATTERN =
	/^(?<base>https:\/\/github\.com)\/(?<owner>[a-z0-9.-]+)\/(?<repository>[a-z0-9.-]+)\/issues\/(?<number>\d+)$/;
