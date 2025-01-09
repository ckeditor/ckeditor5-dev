/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Changelog file name.
 */
export const CHANGELOG_FILE = 'CHANGELOG.md';

/**
 * Changelog header.
 */
export const CHANGELOG_HEADER = 'Changelog\n=========\n\n';

/**
 * A size of default indent for a log.
 */
export const CLI_INDENT_SIZE = 3;

/**
 * A size of indent for a second and next lines in a log. The number is equal to length of the log string:
 * '* 1234567 ', where '1234567' is a short commit id.
 * It does not include a value from `cli.INDENT_SIZE`.
 */
export const CLI_COMMIT_INDENT_SIZE = 10;
