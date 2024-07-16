/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
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
const {
	getLastFromChangelog,
	getLastPreRelease,
	getNextPreRelease,
	getLastNightly,
	getNextNightly,
	getCurrent,
	getLastTagFromGit
} = require( './utils/versions' );
const { getChangesForVersion, getChangelog, saveChangelog } = require( './utils/changelog' );
const executeInParallel = require( './utils/executeinparallel' );
const validateRepositoryToRelease = require( './utils/validaterepositorytorelease' );
const checkVersionAvailability = require( './utils/checkversionavailability' );
const verifyPackagesPublishedCorrectly = require( './tasks/verifypackagespublishedcorrectly' );
const getNpmTagFromVersion = require( './utils/getnpmtagfromversion' );
const isVersionPublishableForTag = require( './utils/isversionpublishablefortag' );

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
	getLastPreRelease,
	getNextPreRelease,
	getLastNightly,
	getNextNightly,
	getCurrent,
	getLastTagFromGit,
	getNpmTagFromVersion,
	getChangesForVersion,
	getChangelog,
	saveChangelog,
	validateRepositoryToRelease,
	verifyPackagesPublishedCorrectly,
	checkVersionAvailability,
	isVersionPublishableForTag
};
