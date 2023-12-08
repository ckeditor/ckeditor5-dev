/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const generateChangelogForSinglePackage = require( './tasks/generatechangelogforsinglepackage' );
const generateChangelogForMonoRepository = require( './tasks/generatechangelogformonorepository' );
const updateDependencies = require( './tasks/updatedependencies' );
const commitAndTag = require( './tasks/commitandtag' );
const createGithubRelease = require( './tasks/creategithubrelease' );
const reassignNpmTags = require( './tasks/reassignnpmtags' );
const prepareRepository = require( './tasks/preparerepository' );
const push = require( './tasks/push' );
const publishPackages = require( './tasks/publishpackages' );
const updateVersions = require( './tasks/updateversions' );
const cleanUpPackages = require( './tasks/cleanuppackages' );
const { getLastFromChangelog, getLastNightly, getNextNightly, getCurrent, getLastTagFromGit } = require( './utils/versions' );
const { getChangesForVersion, getChangelog, saveChangelog } = require( './utils/changelog' );
const executeInParallel = require( './utils/executeinparallel' );
const validateRepositoryToRelease = require( './utils/validaterepositorytorelease' );
const checkVersionAvailability = require( './utils/checkversionavailability' );

module.exports = {
	generateChangelogForSinglePackage,
	generateChangelogForMonoRepository,
	updateDependencies,
	updateVersions,
	prepareRepository,
	commitAndTag,
	createGithubRelease,
	push,
	cleanUpPackages,
	publishPackages,
	reassignNpmTags,
	executeInParallel,
	getLastFromChangelog,
	getLastNightly,
	getNextNightly,
	getCurrent,
	getLastTagFromGit,
	getChangesForVersion,
	getChangelog,
	saveChangelog,
	validateRepositoryToRelease,
	checkVersionAvailability
};
