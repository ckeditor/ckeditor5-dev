/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const releaseSubRepositories = require( './tasks/releasesubrepositories' );
const preparePackages = require( './tasks/preparepackages' );
const bumpVersions = require( './tasks/bumpversions' );
const generateChangelogForSinglePackage = require( './tasks/generatechangelogforsinglepackage' );
const generateChangelogForMonoRepository = require( './tasks/generatechangelogformonorepository' );
const updateCKEditor5Dependencies = require( './tasks/updateckeditor5dependencies' );
const updateDependenciesVersions = require( './utils/updatedependenciesversions' );
const { getLastFromChangelog, getCurrent, getLastTagFromGit } = require( './utils/versions' );
const { getChangesForVersion, getChangelog, saveChangelog } = require( './utils/changelog' );

module.exports = {
	releaseSubRepositories,
	preparePackages,
	bumpVersions,
	generateChangelogForSinglePackage,
	generateChangelogForMonoRepository,
	updateCKEditor5Dependencies,
	getLastFromChangelog,
	getCurrent,
	getLastTagFromGit,
	getChangesForVersion,
	getChangelog,
	saveChangelog,
	updateDependenciesVersions
};
