/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export const CHANGELOG_FILE = 'CHANGELOG.md';
export const CHANGELOG_HEADER = 'Changelog\n=========';
export const ORGANISATION_NAMESPACE = '@ckeditor';
export const NPM_URL = 'https://www.npmjs.com/package';
export const BREAKING_CHANGE_URL = 'https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html';
export const VERSIONING_POLICY_URL = 'https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html';
export const SECTIONS = {
	major: { title: `MAJOR BREAKING CHANGES [ℹ️](${BREAKING_CHANGE_URL}#major-and-minor-breaking-changes)` },
	minor: { title: `MINOR BREAKING CHANGES [ℹ️](${BREAKING_CHANGE_URL}#major-and-minor-breaking-changes)` },
	Feature: { title: 'Features' },
	Fix: { title: 'Bug fixes' },
	Other: { title: 'Other changes' },
	invalid: { title: 'Invalid changes' }
} as const;
