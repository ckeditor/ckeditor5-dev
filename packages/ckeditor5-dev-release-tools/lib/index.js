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
const updateDependencies = require( './tasks/updatedependencies' );
const updateDependenciesVersions = require( './utils/updatedependenciesversions' );
const cleanUpPackages = require( './tasks/cleanuppackages' );
const { getLastFromChangelog, getCurrent, getLastTagFromGit } = require( './utils/versions' );
const { getChangesForVersion, getChangelog, saveChangelog } = require( './utils/changelog' );

const executeInParallel = require( './utils/executeinparallel' );

module.exports = {
	executeInParallel,
	releaseSubRepositories,
	preparePackages,
	bumpVersions,
	generateChangelogForSinglePackage,
	generateChangelogForMonoRepository,
	updateCKEditor5Dependencies,
	updateDependencies,
	getLastFromChangelog,
	getCurrent,
	getLastTagFromGit,
	getChangesForVersion,
	getChangelog,
	saveChangelog,
	updateDependenciesVersions,
	cleanUpPackages
};
