/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const releaseSubRepositories = require( './tasks/releasesubrepositories' );
const bumpVersions = require( './tasks/bumpversions' );
const generateChangelogForSinglePackage = require( './tasks/generatechangelogforsinglepackage' );
const generateChangelogForMonoRepository = require( './tasks/generatechangelogformonorepository' );
const updateCKEditor5Dependencies = require( './tasks/updateckeditor5dependencies' );
const { getLastFromChangelog, getCurrent, getLastTagFromGit } = require( './utils/versions' );
const { getChangesForVersion, getChangelog, saveChangelog } = require( './utils/changelog' );

module.exports = {
	releaseSubRepositories,
	bumpVersions,
	generateChangelogForSinglePackage,
	generateChangelogForMonoRepository,
	updateCKEditor5Dependencies,
	getLastFromChangelog,
	getCurrent,
	getLastTagFromGit,
	getChangesForVersion,
	getChangelog,
	saveChangelog
};